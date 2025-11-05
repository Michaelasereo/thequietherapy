# Partner Dashboard System - Complete Overview

## 📋 Table of Contents
1. [Database Schema](#database-schema)
2. [API Routes](#api-routes)
3. [Frontend Components](#frontend-components)
4. [Credit Allocation System](#credit-allocation-system)
5. [CSV Upload System](#csv-upload-system)
6. [Magic Link System](#magic-link-system)

---

## 🗄️ Database Schema

### 1. Users Table (Partner Records)
```sql
-- Partners are stored in the users table with user_type = 'partner'
-- Key columns for partners:
- id (UUID, PRIMARY KEY)
- email (VARCHAR, UNIQUE)
- full_name (VARCHAR)
- user_type ('partner')
- company_name (VARCHAR)
- organization_type (VARCHAR)
- partner_status ('pending', 'active', 'rejected')
- partner_credits (INTEGER) -- Total credits purchased
- credits (INTEGER) -- Available credits
- temporary_approval (BOOLEAN) -- Allows access during review
- onboarding_data (JSONB) -- Stores enrollment information
```

**Location**: `users` table in Supabase

### 2. Partner Members Table
```sql
CREATE TABLE IF NOT EXISTS public.partner_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    department VARCHAR(100),
    employee_id VARCHAR(100),
    status_type VARCHAR(20) CHECK (status_type IN ('doctor', 'student')),
    cader_level VARCHAR(100),
    credits_assigned INTEGER NOT NULL DEFAULT 0,
    credits_used INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'removed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(partner_id, user_id)
);
```

**Location**: `create-partner-members-schema.sql`

### 3. Partner Credits Table
```sql
CREATE TABLE partner_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    employee_email TEXT NOT NULL,
    employee_name TEXT,
    credits_allocated INTEGER NOT NULL DEFAULT 1,
    credits_used INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
    session_duration_minutes INTEGER NOT NULL DEFAULT 25,
    allocated_by UUID REFERENCES users(id),
    allocated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL
);
```

**Location**: `add-payment-tables.sql`, `create-pricing-system-schema.sql`

### 4. CSV Uploads Tracking Table
```sql
CREATE TABLE IF NOT EXISTS public.csv_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    total_records INTEGER NOT NULL DEFAULT 0,
    successful_records INTEGER NOT NULL DEFAULT 0,
    failed_records INTEGER NOT NULL DEFAULT 0,
    errors JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);
```

**Location**: `create-partner-members-schema.sql`

---

## 🔧 Database Functions

### 1. allocate_partner_credit()
```sql
CREATE OR REPLACE FUNCTION allocate_partner_credit(
    p_partner_id UUID,
    p_employee_email TEXT,
    p_employee_name TEXT DEFAULT NULL,
    p_credits_count INTEGER DEFAULT 1,
    p_expires_days INTEGER DEFAULT 90
)
RETURNS BOOLEAN AS $$
DECLARE
    credit_record UUID;
    i INTEGER;
BEGIN
    -- Verify partner exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_partner_id 
        AND user_type = 'partner' 
        AND is_active = true
    ) THEN
        RETURN false;
    END IF;

    -- Create credit allocations (one credit per loop iteration)
    FOR i IN 1..p_credits_count LOOP
        INSERT INTO partner_credits (
            partner_id,
            employee_email,
            employee_name,
            credits_allocated,
            credits_used,
            session_duration_minutes,
            status,
            allocated_by,
            allocated_at,
            expires_at
        ) VALUES (
            p_partner_id,
            p_employee_email,
            p_employee_name,
            1, -- Each credit is 1 session
            0,
            25, -- Partner credits are 25-minute sessions
            'active',
            p_partner_id,
            NOW(),
            CASE WHEN p_expires_days > 0 THEN NOW() + (p_expires_days || ' days')::INTERVAL ELSE NULL END
        );
    END LOOP;

    RETURN true;
END;
$$ LANGUAGE plpgsql;
```

**Location**: `add-payment-tables.sql`

### 2. use_partner_credit()
```sql
CREATE OR REPLACE FUNCTION use_partner_credit(
    p_employee_email TEXT,
    p_session_id UUID
)
RETURNS UUID AS $$
DECLARE
    credit_id UUID;
BEGIN
    -- Find an available partner credit
    SELECT id INTO credit_id
    FROM partner_credits
    WHERE employee_email = p_employee_email
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY allocated_at ASC
    LIMIT 1;

    IF credit_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Mark credit as used
    UPDATE partner_credits
    SET 
        status = 'used',
        used_at = NOW(),
        session_id = p_session_id,
        credits_used = 1
    WHERE id = credit_id;

    RETURN credit_id;
END;
$$ LANGUAGE plpgsql;
```

**Location**: `add-payment-tables.sql`

---

## 🛣️ API Routes

### 1. Partner Enrollment
**File**: `app/api/partner/enroll/route.ts`

**Endpoint**: `POST /api/partner/enroll`

**Functionality**:
- Creates new partner account
- Handles existing partner accounts (sends magic link instead)
- Sets partner_status to 'pending'
- Sets temporary_approval to true for immediate access
- Sends magic link email

**Key Code**:
```typescript
// Check if user already exists (any type)
const { data: existingUser } = await supabase
  .from('users')
  .select('id, email, user_type')
  .eq('email', email)
  .single()

if (existingUser) {
  if (existingUser.user_type === 'partner') {
    // Partner already exists - send magic link instead
    const magicLinkResult = await createMagicLinkForAuthType(...)
    return NextResponse.json({ success: true, ... })
  } else {
    // Email exists but is not a partner
    return NextResponse.json({ 
      success: false,
      error: `This email is already registered as a ${existingUser.user_type}...`
    }, { status: 400 })
  }
}

// Create new partner
const { data: newPartner } = await supabase
  .from('users')
  .insert({
    email,
    full_name: organizationName,
    user_type: 'partner',
    company_name: organizationName,
    partner_status: 'pending',
    temporary_approval: true,
    is_verified: true,
    is_active: true,
    credits: 0,
    onboarding_data: { ... }
  })
```

### 2. CSV Upload Members
**File**: `app/api/partner/upload-members/route.ts`

**Endpoint**: `POST /api/partner/upload-members`

**Functionality**:
- Accepts CSV content (text/csv or multipart/form-data)
- Validates required columns: firstname, email, statustype, caderlevel
- Creates partner_members records
- Creates user accounts for members
- Sends magic link emails
- Does NOT allocate credits automatically (removed per user request)

**Key Code**:
```typescript
// Parse CSV
const lines = text.split('\n').filter(line => line.trim())
const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

// Validate required columns
const requiredColumns = ['firstname', 'email', 'statustype', 'caderlevel']
const missingColumns = requiredColumns.filter(col => !headers.includes(col))

// Process each row
for (let i = 1; i < lines.length; i++) {
  // Create partner_member
  const { data: newMember } = await supabase
    .from('partner_members')
    .insert(memberData)
    .select()
    .single()

  // Create user account
  const { data: userData } = await supabase
    .from('users')
    .insert({
      email: memberData.email,
      full_name: memberData.first_name,
      user_type: 'individual',
      partner_member_id: newMember.id,
      onboarding_data: { ... }
    })
    .select()
    .single()

  // Send magic link (NO CREDIT ALLOCATION - removed per user request)
  const magicLinkResult = await createMagicLinkForAuthType(...)
}
```

### 3. Bulk Upload Members (with Credits)
**File**: `app/api/partner/bulk-upload-members/route.ts`

**Endpoint**: `POST /api/partner/bulk-upload-members`

**Functionality**:
- Accepts CSV with name, email, phone, credits columns
- Validates partner has enough credits
- Creates/updates user accounts
- **Allocates credits using allocate_partner_credit() function**
- Updates partner's credit balance

**Key Code**:
```typescript
// Validate partner has enough credits
const availableCredits = partnerData.credits || 0
if (totalRequestedCredits > availableCredits) {
  return NextResponse.json({ 
    error: `Insufficient credits. Available: ${availableCredits}, Required: ${totalRequestedCredits}` 
  }, { status: 400 })
}

// Process valid records
for (const record of validRecords) {
  // Create or update user
  let userId = existingUser?.id
  if (!userId) {
    const { data: newUser } = await supabase
      .from('users')
      .insert({ ... })
      .select('id')
      .single()
    userId = newUser.id
  }

  // Allocate partner credits using RPC function
  const { error: creditError } = await supabase
    .rpc('allocate_partner_credit', {
      p_partner_id: partnerId,
      p_employee_email: record.email.toLowerCase(),
      p_employee_name: record.name,
      p_credits_count: record.creditsToAssign,
      p_expires_days: 90
    })
}

// Update partner's credit balance
await supabase
  .from('users')
  .update({ credits: availableCredits - creditsUsed })
  .eq('id', partnerId)
```

### 4. Get Partner Members
**File**: `app/api/partner/members/route.ts`

**Endpoint**: `GET /api/partner/members`

**Functionality**:
- Returns all members for the authenticated partner
- Fetches from partner_members table
- Transforms data for frontend

**Key Code**:
```typescript
const { data: members } = await supabase
  .from('partner_members')
  .select(`
    id,
    first_name,
    email,
    credits_assigned,
    status,
    created_at
  `)
  .eq('partner_id', partnerId)
  .order('created_at', { ascending: false })
```

### 5. Partner Dashboard Data
**File**: `app/api/partner/dashboard-data/route.ts`

**Endpoint**: `GET /api/partner/dashboard-data?partnerId={id}`

**Functionality**:
- Returns partner summary statistics
- Fetches partner info, members, sessions, credit transactions
- Calculates totals and recent activity

**Key Code**:
```typescript
// Fetch partner members
const { data: members } = await supabase
  .from('users')
  .select('*')
  .eq('partner_id', partnerId)
  .eq('is_active', true)

// Fetch sessions for partner members
const { data: sessions } = await supabase
  .from('sessions')
  .select('*')
  .in('user_id', memberIds)

// Fetch credit transactions
const { data: creditTransactions } = await supabase
  .from('credit_transactions')
  .select('*')
  .eq('partner_id', partnerId)
  .order('created_at', { ascending: false })

// Calculate stats
const totalCreditsPurchased = creditTransactions?.reduce(...) || 0
const totalCreditsUsed = creditTransactions?.reduce(...) || 0
const creditsRemaining = totalCreditsPurchased - totalCreditsUsed
```

### 6. Partner Credits Summary
**File**: `app/api/partner/credits-summary/route.ts`

**Endpoint**: `GET /api/partner/credits-summary`

**Functionality**:
- Returns credit balance summary
- Calculates from credit_transactions table

### 7. Partner Me
**File**: `app/api/partner/me/route.ts`

**Endpoint**: `GET /api/partner/me`

**Functionality**:
- Returns authenticated partner's information
- Used for dashboard layout and partner name display

---

## 🎨 Frontend Components

### 1. Partner Dashboard Layout
**File**: `app/partner/dashboard/layout.tsx`

**Features**:
- Sidebar navigation
- Partner name display
- Status badges (pending/approved)
- Feature access control based on partner_status

**Key Code**:
```typescript
const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/partner/dashboard', enabled: true },
  { id: 'members', label: 'Members', icon: Users, href: '/partner/dashboard/members', enabled: isApproved },
  { id: 'credits', label: 'Credits', icon: CreditCard, href: '/partner/dashboard/credits', enabled: isApproved },
  { id: 'sessions', label: 'Sessions', icon: Calendar, href: '/partner/dashboard/sessions', enabled: isApproved },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/partner/dashboard/settings', enabled: isApproved },
];
```

### 2. Partner Dashboard Overview
**File**: `app/partner/dashboard/page.tsx`

**Features**:
- Summary cards (credits purchased, remaining, active members, sessions)
- Recent activity feed
- Quick actions buttons
- Under review banner

**Key Code**:
```typescript
useEffect(() => {
  const fetchDashboardData = async () => {
    const response = await fetch('/api/partner/me')
    const partnerData = await response.json()
    
    if (partnerData.id) {
      const dashboardResponse = await fetch(`/api/partner/dashboard-data?partnerId=${partnerData.id}`)
      const data = await dashboardResponse.json()
      setDashboardData(data)
    }
  }
  fetchDashboardData()
}, [])
```

### 3. Partner Members Page
**File**: `app/partner/dashboard/members/page.tsx`

**Features**:
- Summary cards (total members, active, sessions, upcoming)
- CSV upload component integration
- Manual member addition form
- Member list table with actions
- Search and filtering

**Key Code**:
```typescript
// Manual add member
const handleManualAdd = async () => {
  // Creates CSV content for single member
  const csvContent = `firstname,email,statustype,caderlevel,phone,department,employeeid\n${manualName},${manualEmail},${manualStatusType},${manualCaderLevel}...`
  
  const response = await fetch('/api/partner/upload-members', {
    method: 'POST',
    headers: { 'Content-Type': 'text/csv' },
    body: csvContent
  })
}
```

### 4. Partner Credits Page
**File**: `app/partner/dashboard/credits/page.tsx`

**Features**:
- Credit balance summary cards
- Buy credits (package or custom)
- Assign credits to members
- Credit history table

**Key Code**:
```typescript
const handleAssignCredits = async () => {
  const response = await fetch('/api/partner/assign-credits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      memberId: assignMember,
      credits: assignAmount
    })
  })
}
```

### 5. CSV Upload Component
**File**: `components/csv-upload.tsx`

**Features**:
- File upload (CSV/Excel)
- CSV parsing and validation
- Preview table with error highlighting
- Upload progress tracking
- Error display (handles both string and object errors)

**Key Code**:
```typescript
const processFile = async (file: File) => {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const jsonData = XLSX.utils.sheet_to_json(worksheet) as CSVRow[]

  // Normalize phone numbers - convert to string if needed
  const normalizedData = jsonData.map(row => ({
    ...row,
    phone: row.phone ? String(row.phone).trim() : ''
  }))

  // Validate data
  const validationErrors = validateData(normalizedData)
  setErrors(validationErrors)
}

const handleUpload = async () => {
  const csvContent = convertDataToCSV(data)
  const response = await fetch('/api/partner/upload-members', {
    method: 'POST',
    headers: { 'Content-Type': 'text/csv' },
    body: csvContent
  })
}
```

---

## 💳 Credit Allocation System

### Flow Diagram
```
1. Partner purchases credits
   ↓
2. Credits stored in users.credits (partner balance)
   ↓
3. Partner uploads members via CSV
   ↓
4. Partner allocates credits to members
   ↓
5. allocate_partner_credit() function called
   ↓
6. Individual credits created in partner_credits table
   ↓
7. Member uses credit for session
   ↓
8. use_partner_credit() function marks credit as used
```

### Key Points:
- **Partner credits**: Stored in `users.credits` for partner account
- **Member credits**: Stored in `partner_credits` table (one row per credit)
- **Allocation**: Uses `allocate_partner_credit()` RPC function
- **Usage**: Uses `use_partner_credit()` RPC function
- **Expiration**: Credits can expire (default 90 days)
- **Session duration**: Partner credits are 25-minute sessions

### Important Note:
- **CSV upload does NOT automatically allocate credits** (removed per user request)
- Credits must be allocated manually via the Credits page after upload

---

## 📤 CSV Upload System

### Two Upload Methods:

#### 1. Simple Upload (`/api/partner/upload-members`)
- **Purpose**: Quick member addition
- **Columns**: firstname, email, statustype, caderlevel, phone, department, employeeid
- **Creates**: partner_members + user accounts
- **Sends**: Magic link emails
- **Does NOT**: Allocate credits automatically

#### 2. Bulk Upload with Credits (`/api/partner/bulk-upload-members`)
- **Purpose**: Upload members with credit allocation
- **Columns**: name, email, phone, credits (optional)
- **Creates**: partner_members + user accounts
- **Allocates**: Credits using `allocate_partner_credit()` function
- **Updates**: Partner's credit balance

### CSV Validation:
- Required fields checked
- Email format validation
- Phone format validation (handles numbers converted to strings)
- Status type validation (doctor/student)
- Duplicate email detection

---

## 🔗 Magic Link System

### Integration:
- Used in partner enrollment
- Used in member upload
- Sends login/signup links via email

### Function:
**Location**: `lib/auth.ts` - `createMagicLinkForAuthType()`

**Usage**:
```typescript
const magicLinkResult = await createMagicLinkForAuthType(
  email,
  'partner', // or 'individual'
  'login', // or 'signup'
  {
    user_type: 'partner',
    partner_id: partnerId,
    // ... other metadata
  }
)
```

### Email Service:
- Uses Brevo (formerly Sendinblue) SMTP
- Sender: asereopeyemimichael@gmail.com
- Custom email templates for partner vs individual

---

## 🔐 Authentication & Security

### API Protection:
- All partner APIs use `requireApiAuth(['partner'])`
- Validates session cookie
- Checks user_type === 'partner'
- Returns 401 if unauthorized

### Row Level Security (RLS):
- `partner_members`: Partners can only see their own members
- `csv_uploads`: Partners can only see their own uploads
- Service role can manage all records

---

## 📊 Data Flow Summary

### Member Addition Flow:
```
1. Partner uploads CSV or adds manually
   ↓
2. API validates and processes
   ↓
3. Creates partner_members record
   ↓
4. Creates user account (user_type = 'individual')
   ↓
5. Links user to partner via partner_id
   ↓
6. Stores onboarding_data in user record
   ↓
7. Sends magic link email
   ↓
8. Member clicks link and logs in
   ↓
9. Partner can later allocate credits via Credits page
```

### Credit Allocation Flow:
```
1. Partner navigates to Credits page
   ↓
2. Selects member and credits amount
   ↓
3. API calls allocate_partner_credit() function
   ↓
4. Function creates individual credit records in partner_credits
   ↓
5. Updates partner's credit balance
   ↓
6. Member can now use credits for sessions
```

---

## 🐛 Known Issues & Notes

1. **CSV Upload**: Does not allocate credits automatically (by design per user request)
2. **Phone Validation**: Handles numbers converted to strings from Excel
3. **Error Display**: Handles both string and object error formats
4. **Partner Status**: Partners get temporary_approval for immediate access during review
5. **Magic Links**: 24-hour expiry for regular users, custom expiry for partners

---

## 📁 File Structure

```
app/
├── api/
│   └── partner/
│       ├── enroll/route.ts              # Partner enrollment
│       ├── upload-members/route.ts       # CSV upload (no credits)
│       ├── bulk-upload-members/route.ts # CSV upload with credits
│       ├── members/route.ts              # Get partner members
│       ├── credits-summary/route.ts     # Credit balance
│       ├── dashboard-data/route.ts       # Dashboard stats
│       └── me/route.ts                   # Partner info
├── partner/
│   ├── dashboard/
│   │   ├── page.tsx                      # Dashboard overview
│   │   ├── layout.tsx                    # Dashboard layout
│   │   ├── members/page.tsx             # Members management
│   │   └── credits/page.tsx             # Credits management
│   └── enroll/page.tsx                   # Partner enrollment form

components/
└── csv-upload.tsx                        # CSV upload component

lib/
└── auth.ts                               # Magic link creation

database/
├── create-partner-members-schema.sql     # Partner members schema
├── add-payment-tables.sql                # Credit allocation functions
└── create-pricing-system-schema.sql     # Partner credits table
```

---

## 🚀 Quick Reference

### Add Member Manually:
```typescript
POST /api/partner/upload-members
Content-Type: text/csv

firstname,email,statustype,caderlevel
John,john@example.com,doctor,consultant
```

### Upload CSV with Credits:
```typescript
POST /api/partner/bulk-upload-members
Content-Type: text/csv

name,email,credits
John,john@example.com,5
```

### Allocate Credits:
```typescript
// Via RPC function
await supabase.rpc('allocate_partner_credit', {
  p_partner_id: partnerId,
  p_employee_email: email,
  p_employee_name: name,
  p_credits_count: 5,
  p_expires_days: 90
})
```

---

## 📝 Notes for Senior Developer

1. **Credit System**: Two-tier system - partner credits (balance) and member credits (individual allocations)
2. **CSV Upload**: Two separate endpoints for different use cases
3. **No Auto-Allocation**: CSV upload does NOT allocate credits automatically (per user requirement)
4. **Magic Links**: All authentication uses magic links, no password system
5. **Partner Status**: Uses temporary_approval flag for immediate access during review
6. **Error Handling**: CSV component handles both string and object error formats
7. **Phone Validation**: Normalizes phone numbers from Excel (handles numbers as strings)

---

**Last Updated**: 2025-01-04
**Version**: 1.0

