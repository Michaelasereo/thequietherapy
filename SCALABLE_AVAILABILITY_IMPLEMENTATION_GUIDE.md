
# Scalable Availability System Implementation Guide

## Overview

This guide documents the implementation of the new enterprise-grade availability management system that replaces the old dual data model with a clean, scalable architecture.

## Architecture Summary

### Core Principle: Two Types of Availability

1. **Template Availability (Recurring Rules):** Standard, repeating weekly schedule (e.g., "Every Monday, 9 AM - 5 PM")
2. **Exception Availability (Overrides):** Specific, one-off changes to that template (e.g., "Monday, Jan 20th: Unavailable all day")

### New Database Schema

#### Tables Created:
- `availability_templates` - Stores recurring weekly patterns
- `availability_overrides` - Stores specific date exceptions

#### Key Features:
- Single source of truth for availability generation
- Handles real-world complexity (recurring + exceptions)
- Future-proof and extensible
- Efficient storage (no more thousands of individual slots)

## Implementation Steps

### 1. Database Setup

Run the schema creation script:
```bash
psql -d your_database -f create-scalable-availability-schema.sql
```

This creates:
- New tables with proper indexes
- Row Level Security policies
- Utility functions for availability generation
- Sample data migration

### 2. Data Migration

Run the migration script to convert existing data:
```bash
psql -d your_database -f migrate-availability-to-templates.sql
```

This migrates:
- Existing `therapist_availability` records to `availability_templates`
- Preserves all existing availability data
- Creates backup of old data

### 3. API Endpoints

#### Core Generation API
- **GET** `/api/therapist/availability/generate` - Generate available slots for date range
- **POST** `/api/therapist/availability/generate` - Generate slots for specific date

#### Template Management API
- **GET** `/api/therapist/availability/template` - Get therapist's templates
- **POST** `/api/therapist/availability/template` - Create/update templates
- **PUT** `/api/therapist/availability/template` - Update specific template
- **DELETE** `/api/therapist/availability/template` - Delete template

#### Override Management API
- **GET** `/api/therapist/availability/override` - Get overrides for date range
- **POST** `/api/therapist/availability/override` - Create/update override
- **PUT** `/api/therapist/availability/override` - Bulk create overrides
- **DELETE** `/api/therapist/availability/override` - Delete override

### 4. Frontend Components

#### Updated Components:
- `AvailabilitySchedule` - Now uses template API
- `AvailabilityCalendar` - Legacy component (can be deprecated)
- `AvailabilityOverrides` - New component for date exceptions

#### New UI Features:
- Weekly schedule management (templates)
- Calendar-based override management
- Real-time availability generation
- Intuitive exception handling

## Usage Examples

### Setting Weekly Schedule (Templates)

```typescript
// Therapist sets their recurring weekly availability
const templates = [
  {
    day_of_week: 1, // Monday
    start_time: "09:00",
    end_time: "17:00",
    session_duration: 60,
    session_type: "individual",
    max_sessions: 8
  },
  // ... other days
]

await fetch('/api/therapist/availability/template', {
  method: 'POST',
  body: JSON.stringify({
    therapist_id: therapistId,
    templates
  })
})
```

### Creating Date Overrides

```typescript
// Therapist takes a vacation day
await fetch('/api/therapist/availability/override', {
  method: 'POST',
  body: JSON.stringify({
    therapist_id: therapistId,
    override_date: "2024-01-20",
    is_available: false,
    reason: "vacation"
  })
})

// Therapist has custom hours for training
await fetch('/api/therapist/availability/override', {
  method: 'POST',
  body: JSON.stringify({
    therapist_id: therapistId,
    override_date: "2024-01-21",
    is_available: true,
    start_time: "10:00",
    end_time: "14:00",
    reason: "training"
  })
})
```

### Generating Available Slots

```typescript
// Get available slots for next week
const response = await fetch(
  `/api/therapist/availability/generate?therapist_id=${therapistId}&start_date=2024-01-15&end_date=2024-01-21`
)

const { availability } = await response.json()
// Returns generated slots with template + override logic applied
```

## Benefits of New Architecture

### 1. Single Source of Truth
- The `generate` API is the only place that calculates availability
- Frontend and booking system just ask for slots between Date X and Y
- No more data synchronization issues

### 2. Handles Real-World Complexity
- Therapists think in repeating schedules and exceptions
- This model matches their mental model perfectly
- Supports both "every Monday" and "except this Monday"

### 3. Simplifies UI Logic
- Weekly scheduler manages templates only
- Calendar manages overrides only
- Each component has a single, clear responsibility

### 4. Future-Proof
- Want to add "Buffer Times"? Add a `buffer_minutes` column to templates
- Want "Recurring Exceptions"? Add a new table for recurring overrides
- Changes are contained and simple

### 5. Efficient
- No more storing thousands of individual time slots
- Store compact templates + handful of exceptions
- Scales to any number of therapists and dates

## Migration Strategy

### Phase 1: Parallel Running
- Deploy new system alongside old system
- Migrate data but keep old APIs working
- Test new system thoroughly

### Phase 2: Gradual Cutover
- Update frontend components one by one
- Start with new therapists using new system
- Monitor for issues

### Phase 3: Full Migration
- Update all components to use new APIs
- Remove old availability endpoints
- Drop old `therapist_availability` table

## Testing Checklist

### Database
- [ ] New tables created successfully
- [ ] Indexes are working
- [ ] RLS policies are enforced
- [ ] Migration script runs without errors

### APIs
- [ ] Template CRUD operations work
- [ ] Override CRUD operations work
- [ ] Generation API returns correct slots
- [ ] Authentication and authorization work
- [ ] Error handling is robust

### Frontend
- [ ] Weekly scheduler loads existing templates
- [ ] Weekly scheduler saves new templates
- [ ] Override calendar displays correctly
- [ ] Override creation/editing works
- [ ] Mode switching works smoothly

### Integration
- [ ] Booking system can get available slots
- [ ] Existing sessions don't conflict
- [ ] Timezone handling works correctly
- [ ] Performance is acceptable

## Troubleshooting

### Common Issues

1. **Templates not loading**
   - Check therapist ID is correct
   - Verify API authentication
   - Check database connection

2. **Overrides not saving**
   - Validate date format (YYYY-MM-DD)
   - Check time format (HH:MM)
   - Verify therapist permissions

3. **Generated slots incorrect**
   - Check template data
   - Verify override logic
   - Test date range parameters

### Debug Commands

```sql
-- Check templates for a therapist
SELECT * FROM availability_templates WHERE therapist_id = 'therapist-uuid';

-- Check overrides for a date range
SELECT * FROM availability_overrides 
WHERE therapist_id = 'therapist-uuid' 
AND override_date BETWEEN '2024-01-01' AND '2024-01-31';

-- Test generation function
SELECT * FROM generate_availability_slots(
  'therapist-uuid'::uuid,
  '2024-01-15'::date,
  '2024-01-21'::date
);
```

## Performance Considerations

### Database
- Indexes on `therapist_id`, `day_of_week`, `override_date`
- RLS policies are optimized
- Generation function is efficient

### API
- Caching can be added to generation endpoint
- Pagination for large date ranges
- Rate limiting for high-volume usage

### Frontend
- Lazy loading of calendar data
- Optimistic updates for better UX
- Debounced API calls

## Security

### Authentication
- All endpoints require therapist authentication
- Users can only modify their own data
- Admin endpoints have additional checks

### Authorization
- RLS policies enforce data isolation
- API endpoints validate ownership
- Input validation prevents injection

### Data Privacy
- No sensitive data in availability slots
- Audit trail for all changes
- GDPR compliance for data deletion

## Monitoring

### Metrics to Track
- API response times
- Database query performance
- Error rates by endpoint
- User adoption of new features

### Alerts
- High error rates
- Slow API responses
- Database connection issues
- Failed authentication attempts

## Future Enhancements

### Planned Features
1. **Recurring Overrides** - "Every first Monday of the month"
2. **Buffer Times** - Automatic breaks between sessions
3. **Time Zone Support** - Multi-timezone availability
4. **Bulk Operations** - Mass update templates/overrides
5. **Analytics** - Availability utilization reports

### API Versioning
- Current: v1 (no version prefix)
- Future: `/api/v2/therapist/availability/...`
- Backward compatibility maintained

## Conclusion

This new availability system provides a solid foundation for scaling your therapy platform. The clean separation of templates and overrides, combined with the powerful generation API, makes it easy to handle complex scheduling scenarios while maintaining excellent performance and user experience.

The architecture is designed to grow with your business, supporting new features and use cases as they arise. The migration path ensures minimal disruption to existing users while providing immediate benefits to new implementations.
