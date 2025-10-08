import { supabase } from '@/lib/supabase';

// =============================================
// THERAPIST STATE MANAGEMENT SYSTEM
// Ensures proper lifecycle management with audit trails
// =============================================

export type TherapistStatus = 
  | 'onboarding' 
  | 'pending_verification' 
  | 'active' 
  | 'suspended' 
  | 'offboarded';

export type VerificationStatus = 
  | 'pending' 
  | 'verified' 
  | 'rejected' 
  | 'suspended';

export interface TherapistState {
  id: string;
  therapistId: string;
  currentStatus: TherapistStatus;
  previousStatus?: TherapistStatus;
  statusChangedAt: Date;
  statusChangedBy?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface VerificationAudit {
  id: string;
  therapistId: string;
  action: 'verified' | 'rejected' | 'suspended' | 'reactivated';
  performedBy: string;
  performedAt: Date;
  reason?: string;
  documents?: Document[];
  metadata?: Record<string, any>;
}

export interface Document {
  id: string;
  type: 'license' | 'certification' | 'id' | 'other';
  url: string;
  filename: string;
  uploadedAt: Date;
  verified: boolean;
}

export class TherapistStateManager {
  private supabase = supabase;

  // =============================================
  // STATE TRANSITION MANAGEMENT
  // =============================================

  /**
   * Transition therapist to a new state with full audit trail
   */
  async transitionState(
    therapistId: string, 
    newStatus: TherapistStatus, 
    reason: string, 
    adminId: string,
    metadata?: Record<string, any>
  ): Promise<TherapistState> {
    console.log(`🔄 Transitioning therapist ${therapistId} from current status to ${newStatus}`);

    try {
      // 1. Get current state
      const currentState = await this.getCurrentState(therapistId);
      
      // 2. Validate transition is legal
      this.validateTransition(currentState?.currentStatus, newStatus);

      // 3. Create new state record
      const { data: newState, error: stateError } = await this.supabase
        .from('therapist_states')
        .insert({
          therapist_id: therapistId,
          current_status: newStatus,
          previous_status: currentState?.currentStatus,
          status_changed_by: adminId,
          reason,
          metadata: metadata || null
        })
        .select()
        .single();

      if (stateError) {
        console.error('❌ Error creating therapist state:', stateError);
        throw new Error(`Failed to transition therapist state: ${stateError.message}`);
      }

      // 4. Update related tables based on new status
      await this.updateRelatedTables(therapistId, newStatus, adminId);

      // 5. Log the transition
      console.log(`✅ Therapist ${therapistId} transitioned to ${newStatus}`);
      
      return {
        id: newState.id,
        therapistId: newState.therapist_id,
        currentStatus: newState.current_status,
        previousStatus: newState.previous_status,
        statusChangedAt: new Date(newState.status_changed_at),
        statusChangedBy: newState.status_changed_by,
        reason: newState.reason,
        metadata: newState.metadata
      };

    } catch (error) {
      console.error('❌ Error in therapist state transition:', error);
      throw error;
    }
  }

  /**
   * Get current state of a therapist
   */
  async getCurrentState(therapistId: string): Promise<TherapistState | null> {
    try {
      const { data, error } = await this.supabase
        .from('therapist_states')
        .select('*')
        .eq('therapist_id', therapistId)
        .order('status_changed_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error fetching therapist state:', error);
        throw new Error(`Failed to fetch therapist state: ${error.message}`);
      }

      if (!data) return null;

      return {
        id: data.id,
        therapistId: data.therapist_id,
        currentStatus: data.current_status,
        previousStatus: data.previous_status,
        statusChangedAt: new Date(data.status_changed_at),
        statusChangedBy: data.status_changed_by,
        reason: data.reason,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('❌ Error getting therapist state:', error);
      throw error;
    }
  }

  /**
   * Get complete state history for a therapist
   */
  async getStateHistory(therapistId: string): Promise<TherapistState[]> {
    try {
      const { data, error } = await this.supabase
        .from('therapist_states')
        .select('*')
        .eq('therapist_id', therapistId)
        .order('status_changed_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching therapist state history:', error);
        throw new Error(`Failed to fetch state history: ${error.message}`);
      }

      return data.map(state => ({
        id: state.id,
        therapistId: state.therapist_id,
        currentStatus: state.current_status,
        previousStatus: state.previous_status,
        statusChangedAt: new Date(state.status_changed_at),
        statusChangedBy: state.status_changed_by,
        reason: state.reason,
        metadata: state.metadata
      }));
    } catch (error) {
      console.error('❌ Error getting therapist state history:', error);
      throw error;
    }
  }

  // =============================================
  // VERIFICATION MANAGEMENT
  // =============================================

  /**
   * Verify a therapist with documents and audit trail
   */
  async verifyTherapist(
    therapistId: string,
    adminId: string,
    documents: Document[],
    reason?: string
  ): Promise<VerificationAudit> {
    console.log(`🔍 Verifying therapist ${therapistId} with ${documents.length} documents`);

    try {
      // 1. Validate therapist exists and is in correct state
      const therapist = await this.validateTherapistForVerification(therapistId);

      // 2. Create verification audit record
      const { data: auditRecord, error: auditError } = await this.supabase
        .from('therapist_verification_audit')
        .insert({
          therapist_id: therapistId,
          action: 'verified',
          performed_by: adminId,
          reason: reason || 'Manual verification completed',
          documents: documents,
          metadata: {
            verification_type: 'manual',
            document_count: documents.length,
            admin_verified: true
          }
        })
        .select()
        .single();

      if (auditError) {
        console.error('❌ Error creating verification audit:', auditError);
        throw new Error(`Failed to create verification audit: ${auditError.message}`);
      }

      // 3. Update therapist profile
      await this.supabase
        .from('therapist_profiles')
        .update({
          verification_status: 'verified',
          verified_by: adminId,
          verified_at: new Date().toISOString(),
          verification_documents: documents,
          verification_audit_trail: auditRecord
        })
        .eq('user_id', therapistId);

      // 4. Transition to active status
      await this.transitionState(therapistId, 'active', 'Therapist verification completed', adminId);

      // 5. Update user verification status
      await this.supabase
        .from('users')
        .update({
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', therapistId);

      console.log(`✅ Therapist ${therapistId} verified successfully`);

      return {
        id: auditRecord.id,
        therapistId: auditRecord.therapist_id,
        action: auditRecord.action,
        performedBy: auditRecord.performed_by,
        performedAt: new Date(auditRecord.performed_at),
        reason: auditRecord.reason,
        documents: auditRecord.documents,
        metadata: auditRecord.metadata
      };

    } catch (error) {
      console.error('❌ Error verifying therapist:', error);
      throw error;
    }
  }

  /**
   * Reject therapist verification
   */
  async rejectTherapist(
    therapistId: string,
    adminId: string,
    reason: string,
    documents?: Document[]
  ): Promise<VerificationAudit> {
    console.log(`❌ Rejecting therapist verification ${therapistId}: ${reason}`);

    try {
      // 1. Create rejection audit record
      const { data: auditRecord, error: auditError } = await this.supabase
        .from('therapist_verification_audit')
        .insert({
          therapist_id: therapistId,
          action: 'rejected',
          performed_by: adminId,
          reason,
          documents: documents || [],
          metadata: {
            rejection_reason: reason,
            admin_rejected: true
          }
        })
        .select()
        .single();

      if (auditError) {
        console.error('❌ Error creating rejection audit:', auditError);
        throw new Error(`Failed to create rejection audit: ${auditError.message}`);
      }

      // 2. Update therapist profile
      await this.supabase
        .from('therapist_profiles')
        .update({
          verification_status: 'rejected',
          verification_audit_trail: auditRecord
        })
        .eq('user_id', therapistId);

      // 3. Transition to suspended status
      await this.transitionState(therapistId, 'suspended', `Verification rejected: ${reason}`, adminId);

      console.log(`✅ Therapist ${therapistId} verification rejected`);

      return {
        id: auditRecord.id,
        therapistId: auditRecord.therapist_id,
        action: auditRecord.action,
        performedBy: auditRecord.performed_by,
        performedAt: new Date(auditRecord.performed_at),
        reason: auditRecord.reason,
        documents: auditRecord.documents,
        metadata: auditRecord.metadata
      };

    } catch (error) {
      console.error('❌ Error rejecting therapist:', error);
      throw error;
    }
  }

  /**
   * Suspend a therapist
   */
  async suspendTherapist(
    therapistId: string,
    adminId: string,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<TherapistState> {
    console.log(`⚠️ Suspending therapist ${therapistId}: ${reason}`);

    // 1. Cancel all pending sessions
    await this.cancelPendingSessions(therapistId, adminId, 'Therapist suspended');

    // 2. Transition to suspended state
    const newState = await this.transitionState(
      therapistId, 
      'suspended', 
      reason, 
      adminId, 
      metadata
    );

    // 3. Create suspension audit
    await this.supabase
      .from('therapist_verification_audit')
      .insert({
        therapist_id: therapistId,
        action: 'suspended',
        performed_by: adminId,
        reason,
        metadata: { suspension_reason: reason, ...metadata }
      });

    console.log(`✅ Therapist ${therapistId} suspended successfully`);
    return newState;
  }

  // =============================================
  // VALIDATION METHODS
  // =============================================

  /**
   * Validate that a state transition is legal
   */
  private validateTransition(currentStatus?: TherapistStatus, newStatus?: TherapistStatus): void {
    const validTransitions: Record<TherapistStatus, TherapistStatus[]> = {
      'onboarding': ['pending_verification', 'offboarded'],
      'pending_verification': ['active', 'suspended', 'offboarded'],
      'active': ['suspended', 'offboarded'],
      'suspended': ['active', 'offboarded'],
      'offboarded': [] // Terminal state
    };

    if (!currentStatus) {
      // New therapist - can start with onboarding or pending_verification
      if (newStatus !== 'onboarding' && newStatus !== 'pending_verification') {
        throw new Error(`Invalid initial state: ${newStatus}`);
      }
      return;
    }

    const allowedTransitions = validTransitions[currentStatus];
    if (!newStatus || !allowedTransitions.includes(newStatus)) {
      throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
    }
  }

  /**
   * Validate therapist exists and is in correct state for verification
   */
  private async validateTherapistForVerification(therapistId: string): Promise<any> {
    const { data: therapist, error } = await this.supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        user_type,
        is_active,
        therapist_profiles!inner (
          verification_status
        )
      `)
      .eq('id', therapistId)
      .eq('user_type', 'therapist')
      .single();

    if (error || !therapist) {
      throw new Error('Therapist not found');
    }

    if (!therapist.is_active) {
      throw new Error('Therapist is not active');
    }

    if (therapist.therapist_profiles?.[0]?.verification_status === 'verified') {
      throw new Error('Therapist is already verified');
    }

    return therapist;
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  /**
   * Update related tables when therapist state changes
   */
  private async updateRelatedTables(
    therapistId: string, 
    newStatus: TherapistStatus, 
    adminId: string
  ): Promise<void> {
    switch (newStatus) {
      case 'active':
        // Ensure therapist is active in users table
        await this.supabase
          .from('users')
          .update({ is_active: true })
          .eq('id', therapistId);
        break;

      case 'suspended':
      case 'offboarded':
        // Deactivate therapist
        await this.supabase
          .from('users')
          .update({ is_active: false })
          .eq('id', therapistId);
        break;
    }
  }

  /**
   * Cancel all pending sessions for a therapist
   */
  private async cancelPendingSessions(
    therapistId: string, 
    adminId: string, 
    reason: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('sessions')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by: adminId,
        cancelled_at: new Date().toISOString()
      })
      .eq('therapist_id', therapistId)
      .in('status', ['scheduled', 'confirmed']);

    if (error) {
      console.error('❌ Error cancelling pending sessions:', error);
      // Don't throw - this shouldn't block the suspension
    }
  }

  // =============================================
  // QUERY METHODS
  // =============================================

  /**
   * Get all therapists by status
   */
  async getTherapistsByStatus(status: TherapistStatus): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('therapist_states')
        .select(`
          *,
          users!inner (
            id,
            email,
            full_name,
            created_at,
            therapist_profiles!inner (
              verification_status,
              specializations
            )
          )
        `)
        .eq('current_status', status)
        .order('status_changed_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching therapists by status:', error);
        throw new Error(`Failed to fetch therapists: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error getting therapists by status:', error);
      throw error;
    }
  }

  /**
   * Get therapist verification audit history
   */
  async getVerificationHistory(therapistId: string): Promise<VerificationAudit[]> {
    try {
      const { data, error } = await this.supabase
        .from('therapist_verification_audit')
        .select('*')
        .eq('therapist_id', therapistId)
        .order('performed_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching verification history:', error);
        throw new Error(`Failed to fetch verification history: ${error.message}`);
      }

      return data.map(audit => ({
        id: audit.id,
        therapistId: audit.therapist_id,
        action: audit.action,
        performedBy: audit.performed_by,
        performedAt: new Date(audit.performed_at),
        reason: audit.reason,
        documents: audit.documents,
        metadata: audit.metadata
      }));
    } catch (error) {
      console.error('❌ Error getting verification history:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const therapistStateManager = new TherapistStateManager();
export default therapistStateManager;
