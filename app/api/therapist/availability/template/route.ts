import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError, ValidationError, successResponse } from '@/lib/api-response';
import { AvailabilityService } from '@/lib/availability-service';
import { WeeklyAvailability } from '@/types/availability';
import { createServerClient } from '@/lib/supabase';
import { invalidateTherapistAvailability } from '@/lib/availability-cache';

/**
 * Get availability templates for a therapist
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const therapistId = searchParams.get('therapist_id');

    if (!therapistId) {
      return NextResponse.json({ 
        error: 'Therapist ID is required' 
      }, { status: 400 });
    }

    // Get availability in new format
    const availability = await AvailabilityService.getTherapistAvailability(therapistId);
    const overrides = await AvailabilityService.getAvailabilityOverrides(therapistId);

    return NextResponse.json({ 
      success: true,
      availability,
      overrides,
      templates: [] // Legacy support - can be enhanced later
    }, { status: 200 });

  } catch (error) {
    console.error('Error in template GET API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * Create or update availability templates for a therapist
 */
export async function POST(request: NextRequest) {
  try {
    // SECURE Authentication Check - only therapists can modify templates
    const authResult = await requireApiAuth(['therapist']);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { session } = authResult;
    const body = await request.json();
    
    // Support both new and legacy formats
    if (body.availability) {
      // New format with WeeklyAvailability
      const availability: WeeklyAvailability = body.availability;
      
      if (!availability || !availability.standardHours || !availability.sessionSettings) {
        return NextResponse.json({ 
          error: 'Invalid availability data. Standard hours and session settings are required.' 
        }, { status: 400 });
      }

      // Verify the therapist is updating their own availability
      if (session.user.id !== body.therapist_id) {
        return NextResponse.json({ 
          error: 'Unauthorized: You can only update your own availability' 
        }, { status: 403 });
      }

      // Save using the new service
      const result = await AvailabilityService.saveTherapistAvailability(
        body.therapist_id, 
        availability
      );

      if (!result.success) {
        return NextResponse.json({ 
          error: result.message 
        }, { status: 400 });
      }

      // CRITICAL: Invalidate cache to ensure booking system gets fresh data
      invalidateTherapistAvailability(body.therapist_id);
      console.log('🔄 Cache invalidated for therapist:', body.therapist_id);

      return NextResponse.json({ 
        success: true,
        message: result.message,
        templateId: result.templateId
      }, { status: 200 });

    } else if (body.templates) {
      // Legacy format support
      const { therapist_id, templates } = body;

      if (!therapist_id || !templates || !Array.isArray(templates)) {
        return NextResponse.json({ 
          error: 'Invalid request data. therapist_id and templates array are required.' 
        }, { status: 400 });
      }

      // Verify the therapist is updating their own templates
      if (session.user.id !== therapist_id) {
        return NextResponse.json({ 
          error: 'Unauthorized: You can only update your own templates' 
        }, { status: 403 });
      }

      // Validate templates data
      for (const template of templates) {
        if (!template.day_of_week || template.day_of_week < 0 || template.day_of_week > 6) {
          return NextResponse.json({ 
            error: 'Invalid day_of_week. Must be between 0 (Sunday) and 6 (Saturday).' 
          }, { status: 400 });
        }

        if (!template.start_time || !template.end_time) {
          return NextResponse.json({ 
            error: 'start_time and end_time are required for each template.' 
          }, { status: 400 });
        }

        // Validate time format and logic
        const startTime = new Date(`2000-01-01T${template.start_time}`);
        const endTime = new Date(`2000-01-01T${template.end_time}`);
        
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          return NextResponse.json({ 
            error: 'Invalid time format. Use HH:MM format.' 
          }, { status: 400 });
        }

        if (startTime >= endTime) {
          return NextResponse.json({ 
            error: 'Start time must be before end time.' 
          }, { status: 400 });
        }
      }

      // Delete existing templates for this therapist
      const { error: deleteError } = await supabase
        .from('availability_templates')
        .delete()
        .eq('therapist_id', therapist_id);

      if (deleteError) {
        console.error('Error deleting existing templates:', deleteError);
        return NextResponse.json({ 
          error: 'Failed to update templates' 
        }, { status: 500 });
      }

      // Prepare new templates data
      const templatesData = templates.map(template => ({
        therapist_id,
        day_of_week: template.day_of_week,
        start_time: template.start_time,
        end_time: template.end_time,
        session_duration: template.session_duration || 45,
        session_type: template.session_type || 'individual',
        max_sessions: template.max_sessions || 1,
        is_active: true
      }));

      // Insert new templates
      const { data: insertedTemplates, error: insertError } = await supabase
        .from('availability_templates')
        .insert(templatesData)
        .select();

      if (insertError) {
        console.error('Error inserting templates:', insertError);
        return NextResponse.json({ 
          error: 'Failed to save templates' 
        }, { status: 500 });
      }

      // CRITICAL: Invalidate cache to ensure booking system gets fresh data
      invalidateTherapistAvailability(therapist_id);
      console.log('🔄 Cache invalidated for therapist:', therapist_id);

      return NextResponse.json({ 
        success: true,
        message: 'Availability templates updated successfully',
        templates: insertedTemplates,
        count: insertedTemplates.length
      }, { status: 200 });

    } else {
      return NextResponse.json({ 
        error: 'Invalid request format. Provide either availability or templates data.' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in template POST API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * Update a specific template
 */
export async function PUT(request: NextRequest) {
  try {
    // SECURE Authentication Check
    const authResult = await requireApiAuth(['therapist']);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { session } = authResult;
    const body = await request.json();
    const { template_id, updates } = body;

    if (!template_id || !updates) {
      return NextResponse.json({ 
        error: 'template_id and updates are required' 
      }, { status: 400 });
    }

    // Verify the therapist owns this template
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('availability_templates')
      .select('therapist_id')
      .eq('id', template_id)
      .single();

    if (fetchError || !existingTemplate) {
      return NextResponse.json({ 
        error: 'Template not found' 
      }, { status: 404 });
    }

    if (existingTemplate.therapist_id !== session.user.id) {
      return NextResponse.json({ 
        error: 'Unauthorized: You can only update your own templates' 
      }, { status: 403 });
    }

    // Update the template
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('availability_templates')
      .update(updates)
      .eq('id', template_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating template:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update template' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Template updated successfully',
      template: updatedTemplate
    }, { status: 200 });

  } catch (error) {
    console.error('Error in template PUT API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * Delete a specific template
 */
export async function DELETE(request: NextRequest) {
  try {
    // SECURE Authentication Check
    const authResult = await requireApiAuth(['therapist']);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { session } = authResult;
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('template_id');

    if (!templateId) {
      return NextResponse.json({ 
        error: 'template_id is required' 
      }, { status: 400 });
    }

    // Verify the therapist owns this template
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('availability_templates')
      .select('therapist_id')
      .eq('id', templateId)
      .single();

    if (fetchError || !existingTemplate) {
      return NextResponse.json({ 
        error: 'Template not found' 
      }, { status: 404 });
    }

    if (existingTemplate.therapist_id !== session.user.id) {
      return NextResponse.json({ 
        error: 'Unauthorized: You can only delete your own templates' 
      }, { status: 403 });
    }

    // Delete the template
    const { error: deleteError } = await supabase
      .from('availability_templates')
      .delete()
      .eq('id', templateId);

    if (deleteError) {
      console.error('Error deleting template:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete template' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Template deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error in template DELETE API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
