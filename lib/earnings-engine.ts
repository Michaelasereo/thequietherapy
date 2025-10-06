import { supabase } from '@/lib/supabase';

// =============================================
// FINANCIAL EARNINGS ENGINE
// Proper calculation engine with audit trails and compliance
// =============================================

export interface EarningsTransaction {
  id: string;
  therapistId: string;
  sessionId?: string;
  transactionType: 'session_completion' | 'platform_fee' | 'adjustment' | 'bonus' | 'refund' | 'payout';
  amountKobo: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'failed' | 'reversed';
  calculatedAt: Date;
  calculatedBy?: string;
  payoutDate?: Date;
  auditData: Record<string, any>;
}

export interface EarningsReport {
  therapistId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalEarnings: number;
  platformFees: number;
  netEarnings: number;
  transactionCount: number;
  transactions: EarningsTransaction[];
  calculatedAt: Date;
  calculatedBy: string;
}

export interface SessionEarningsCalculation {
  sessionId: string;
  therapistId: string;
  sessionAmount: number;
  platformFeePercentage: number;
  platformFeeAmount: number;
  therapistEarnings: number;
  currency: string;
  calculationDetails: {
    sessionDate: Date;
    sessionDuration: number;
    therapistRate: number;
    platformFeeRate: number;
  };
}

export class EarningsEngine {
  private supabase = supabase;
  private readonly PLATFORM_FEE_PERCENTAGE = 0.15; // 15% platform fee

  // =============================================
  // SESSION EARNINGS CALCULATION
  // =============================================

  /**
   * Calculate earnings for a completed session
   */
  async calculateSessionEarnings(sessionId: string): Promise<EarningsTransaction> {
    try {
      console.log(`💰 Calculating earnings for session: ${sessionId}`);

      // 1. Get session details
      const session = await this.getSessionDetails(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.status !== 'completed') {
        throw new Error('Can only calculate earnings for completed sessions');
      }

      // 2. Get therapist details
      const therapist = await this.getTherapistDetails(session.therapist_id);
      if (!therapist) {
        throw new Error('Therapist not found');
      }

      // 3. Calculate earnings
      const calculation = this.performEarningsCalculation(session, therapist);

      // 4. Create earnings transaction
      const transaction = await this.createEarningsTransaction({
        therapistId: session.therapist_id,
        sessionId: sessionId,
        transactionType: 'session_completion',
        amountKobo: calculation.therapistEarnings,
        currency: calculation.currency,
        auditData: {
          calculation,
          sessionDetails: session,
          therapistDetails: therapist,
          calculatedAt: new Date().toISOString(),
          calculationVersion: '1.0'
        }
      });

      // 5. Create platform fee transaction
      await this.createEarningsTransaction({
        therapistId: session.therapist_id,
        sessionId: sessionId,
        transactionType: 'platform_fee',
        amountKobo: -calculation.platformFeeAmount, // Negative amount for fee
        currency: calculation.currency,
        auditData: {
          calculation,
          sessionDetails: session,
          therapistDetails: therapist,
          platformFeeRate: calculation.platformFeePercentage,
          calculatedAt: new Date().toISOString(),
          calculationVersion: '1.0'
        }
      });

      console.log(`✅ Earnings calculated for session ${sessionId}: ₦${calculation.therapistEarnings / 100}`);

      return transaction;

    } catch (error) {
      console.error('❌ Error calculating session earnings:', error);
      throw error;
    }
  }

  /**
   * Get earnings report for a therapist in a specific period
   */
  async getEarningsReport(
    therapistId: string, 
    startDate: Date, 
    endDate: Date,
    calculatedBy?: string
  ): Promise<EarningsReport> {
    try {
      console.log(`📊 Generating earnings report for therapist ${therapistId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // 1. Get all transactions in the period
      const { data: transactions, error } = await this.supabase
        .from('earnings_transactions')
        .select('*')
        .eq('therapist_id', therapistId)
        .eq('status', 'confirmed')
        .gte('calculated_at', startDate.toISOString())
        .lte('calculated_at', endDate.toISOString())
        .order('calculated_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching earnings transactions:', error);
        throw new Error(`Failed to fetch earnings data: ${error.message}`);
      }

      // 2. Calculate totals
      const sessionEarnings = transactions
        ?.filter(t => t.transaction_type === 'session_completion')
        .reduce((sum, t) => sum + t.amount_kobo, 0) || 0;

      const platformFees = Math.abs(transactions
        ?.filter(t => t.transaction_type === 'platform_fee')
        .reduce((sum, t) => sum + t.amount_kobo, 0) || 0);

      const adjustments = transactions
        ?.filter(t => ['adjustment', 'bonus', 'refund'].includes(t.transaction_type))
        .reduce((sum, t) => sum + t.amount_kobo, 0) || 0;

      const totalEarnings = sessionEarnings - platformFees + adjustments;

      // 3. Format transactions
      const formattedTransactions: EarningsTransaction[] = (transactions || []).map(t => ({
        id: t.id,
        therapistId: t.therapist_id,
        sessionId: t.session_id,
        transactionType: t.transaction_type,
        amountKobo: t.amount_kobo,
        currency: t.currency,
        status: t.status,
        calculatedAt: new Date(t.calculated_at),
        calculatedBy: t.calculated_by,
        payoutDate: t.payout_date ? new Date(t.payout_date) : undefined,
        auditData: t.audit_data
      }));

      const report: EarningsReport = {
        therapistId,
        period: { startDate, endDate },
        totalEarnings,
        platformFees,
        netEarnings: totalEarnings,
        transactionCount: transactions?.length || 0,
        transactions: formattedTransactions,
        calculatedAt: new Date(),
        calculatedBy: calculatedBy || 'system'
      };

      console.log(`✅ Earnings report generated: ₦${totalEarnings / 100} net earnings from ${transactions?.length || 0} transactions`);

      return report;

    } catch (error) {
      console.error('❌ Error generating earnings report:', error);
      throw error;
    }
  }

  /**
   * Process payout for a therapist
   */
  async processPayout(
    therapistId: string, 
    amountKobo: number, 
    payoutMethod: string,
    processedBy: string,
    reason?: string
  ): Promise<EarningsTransaction> {
    try {
      console.log(`💸 Processing payout for therapist ${therapistId}: ₦${amountKobo / 100}`);

      // 1. Validate payout amount
      const pendingEarnings = await this.getPendingEarnings(therapistId);
      if (amountKobo > pendingEarnings) {
        throw new Error(`Payout amount (₦${amountKobo / 100}) exceeds pending earnings (₦${pendingEarnings / 100})`);
      }

      // 2. Create payout transaction
      const payoutTransaction = await this.createEarningsTransaction({
        therapistId,
        transactionType: 'payout',
        amountKobo: -amountKobo, // Negative amount for payout
        currency: 'NGN',
        auditData: {
          payoutMethod,
          reason: reason || 'Regular payout',
          processedBy,
          processedAt: new Date().toISOString(),
          payoutVersion: '1.0'
        }
      });

      // 3. Update payout date for all confirmed transactions
      await this.supabase
        .from('earnings_transactions')
        .update({ payout_date: new Date().toISOString() })
        .eq('therapist_id', therapistId)
        .eq('status', 'confirmed')
        .is('payout_date', null);

      console.log(`✅ Payout processed successfully for therapist ${therapistId}`);

      return payoutTransaction;

    } catch (error) {
      console.error('❌ Error processing payout:', error);
      throw error;
    }
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  /**
   * Get session details
   */
  private async getSessionDetails(sessionId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select(`
        *,
        therapist:therapist_id (
          id,
          full_name,
          email
        ),
        user:user_id (
          id,
          full_name,
          email
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('❌ Error fetching session details:', error);
      throw new Error(`Failed to fetch session: ${error.message}`);
    }

    return data;
  }

  /**
   * Get therapist details
   */
  private async getTherapistDetails(therapistId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        *,
        therapist_profiles!inner (
          session_rate,
          verification_status
        )
      `)
      .eq('id', therapistId)
      .eq('user_type', 'therapist')
      .single();

    if (error) {
      console.error('❌ Error fetching therapist details:', error);
      throw new Error(`Failed to fetch therapist: ${error.message}`);
    }

    return data;
  }

  /**
   * Perform earnings calculation
   */
  private performEarningsCalculation(session: any, therapist: any): SessionEarningsCalculation {
    // Use therapist's session rate or default rate
    const therapistRate = therapist.therapist_profiles.session_rate || 5000; // Default ₦5000
    const sessionAmount = therapistRate * 100; // Convert to kobo
    
    // Calculate platform fee
    const platformFeeAmount = Math.round(sessionAmount * this.PLATFORM_FEE_PERCENTAGE);
    const therapistEarnings = sessionAmount - platformFeeAmount;

    return {
      sessionId: session.id,
      therapistId: session.therapist_id,
      sessionAmount,
      platformFeePercentage: this.PLATFORM_FEE_PERCENTAGE,
      platformFeeAmount,
      therapistEarnings,
      currency: 'NGN',
      calculationDetails: {
        sessionDate: new Date(session.start_time),
        sessionDuration: session.duration_minutes || 60,
        therapistRate,
        platformFeeRate: this.PLATFORM_FEE_PERCENTAGE
      }
    };
  }

  /**
   * Create earnings transaction record
   */
  private async createEarningsTransaction(data: {
    therapistId: string;
    sessionId?: string;
    transactionType: string;
    amountKobo: number;
    currency: string;
    auditData: Record<string, any>;
  }): Promise<EarningsTransaction> {
    const { data: transaction, error } = await this.supabase
      .from('earnings_transactions')
      .insert({
        therapist_id: data.therapistId,
        session_id: data.sessionId,
        transaction_type: data.transactionType,
        amount_kobo: data.amountKobo,
        currency: data.currency,
        status: 'confirmed',
        audit_data: data.auditData
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating earnings transaction:', error);
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    return {
      id: transaction.id,
      therapistId: transaction.therapist_id,
      sessionId: transaction.session_id,
      transactionType: transaction.transaction_type,
      amountKobo: transaction.amount_kobo,
      currency: transaction.currency,
      status: transaction.status,
      calculatedAt: new Date(transaction.calculated_at),
      calculatedBy: transaction.calculated_by,
      payoutDate: transaction.payout_date ? new Date(transaction.payout_date) : undefined,
      auditData: transaction.audit_data
    };
  }

  /**
   * Get pending earnings for a therapist
   */
  private async getPendingEarnings(therapistId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('earnings_transactions')
      .select('amount_kobo')
      .eq('therapist_id', therapistId)
      .eq('status', 'confirmed')
      .is('payout_date', null);

    if (error) {
      console.error('❌ Error fetching pending earnings:', error);
      throw new Error(`Failed to fetch pending earnings: ${error.message}`);
    }

    return (data || []).reduce((sum, t) => sum + t.amount_kobo, 0);
  }

  /**
   * Add manual adjustment to earnings
   */
  async addAdjustment(
    therapistId: string,
    amountKobo: number,
    reason: string,
    adjustedBy: string,
    sessionId?: string
  ): Promise<EarningsTransaction> {
    try {
      console.log(`🔧 Adding earnings adjustment for therapist ${therapistId}: ₦${amountKobo / 100}`);

      const adjustment = await this.createEarningsTransaction({
        therapistId,
        sessionId,
        transactionType: 'adjustment',
        amountKobo,
        currency: 'NGN',
        auditData: {
          reason,
          adjustedBy,
          adjustedAt: new Date().toISOString(),
          adjustmentType: amountKobo > 0 ? 'bonus' : 'deduction'
        }
      });

      console.log(`✅ Adjustment added successfully`);
      return adjustment;

    } catch (error) {
      console.error('❌ Error adding earnings adjustment:', error);
      throw error;
    }
  }

  /**
   * Get earnings summary for therapist dashboard
   */
  async getEarningsSummary(therapistId: string): Promise<{
    totalEarnings: number;
    pendingEarnings: number;
    paidEarnings: number;
    thisMonthEarnings: number;
    lastPayoutDate?: Date;
    transactionCount: number;
  }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Get all confirmed transactions
      const { data: allTransactions, error } = await this.supabase
        .from('earnings_transactions')
        .select('*')
        .eq('therapist_id', therapistId)
        .eq('status', 'confirmed')
        .gte('calculated_at', startOfYear.toISOString());

      if (error) {
        console.error('❌ Error fetching earnings summary:', error);
        throw new Error(`Failed to fetch earnings summary: ${error.message}`);
      }

      const transactions = allTransactions || [];

      // Calculate totals
      const totalEarnings = transactions.reduce((sum, t) => sum + t.amount_kobo, 0);
      const pendingEarnings = transactions
        .filter(t => !t.payout_date)
        .reduce((sum, t) => sum + t.amount_kobo, 0);
      const paidEarnings = totalEarnings - pendingEarnings;
      
      const thisMonthEarnings = transactions
        .filter(t => new Date(t.calculated_at) >= startOfMonth)
        .reduce((sum, t) => sum + t.amount_kobo, 0);

      // Get last payout date
      const payoutTransactions = transactions.filter(t => t.transaction_type === 'payout');
      const lastPayoutDate = payoutTransactions.length > 0 
        ? new Date(Math.max(...payoutTransactions.map(t => new Date(t.calculated_at).getTime())))
        : undefined;

      return {
        totalEarnings,
        pendingEarnings,
        paidEarnings,
        thisMonthEarnings,
        lastPayoutDate,
        transactionCount: transactions.length
      };

    } catch (error) {
      console.error('❌ Error getting earnings summary:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const earningsEngine = new EarningsEngine();
export default earningsEngine;
