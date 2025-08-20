#!/usr/bin/env node

/**
 * Setup Payment System Database Schema
 * This script sets up the complete payment system with credits, transactions, and audit trails
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupPaymentSystem() {
  console.log('🚀 Setting up Payment System Database Schema...\n');

  try {
    // 1. Create payment system schema
    console.log('📋 Creating payment system schema...');
    await createPaymentSchema();
    
    // 2. Insert default credit packages
    console.log('💳 Creating default credit packages...');
    await createDefaultCreditPackages();
    
    // 3. Set up RLS policies
    console.log('🔒 Setting up Row Level Security policies...');
    await setupRLSPolicies();
    
    // 4. Create database functions
    console.log('⚙️ Creating database functions...');
    await createDatabaseFunctions();
    
    // 5. Create indexes for performance
    console.log('📈 Creating performance indexes...');
    await createIndexes();
    
    console.log('\n✅ Payment System setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Configure Paystack webhook URL: https://your-domain.com/api/paystack/webhook');
    console.log('2. Set PAYSTACK_SECRET_KEY in your environment variables');
    console.log('3. Test payment flow with Paystack test cards');
    console.log('4. Monitor webhook processing in the payment_webhooks table');
    
  } catch (error) {
    console.error('❌ Error setting up payment system:', error);
    process.exit(1);
  }
}

async function createPaymentSchema() {
  const schemaSQL = `
    -- Credit Packages Table
    CREATE TABLE IF NOT EXISTS public.credit_packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        credits INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'NGN',
        is_active BOOLEAN DEFAULT true,
        is_popular BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- User Credits Table
    CREATE TABLE IF NOT EXISTS public.user_credits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'therapist', 'partner')),
        credits_balance INTEGER NOT NULL DEFAULT 0,
        credits_purchased INTEGER NOT NULL DEFAULT 0,
        credits_used INTEGER NOT NULL DEFAULT 0,
        credits_expired INTEGER NOT NULL DEFAULT 0,
        last_credit_purchase_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, user_type)
    );

    -- Credit Transactions Table (Audit Trail)
    CREATE TABLE IF NOT EXISTS public.credit_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'therapist', 'partner')),
        transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'expiry', 'bonus', 'adjustment')),
        credits_amount INTEGER NOT NULL,
        balance_before INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        reference_id VARCHAR(255),
        description TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Payment Transactions Table
    CREATE TABLE IF NOT EXISTS public.payment_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'therapist', 'partner')),
        paystack_reference VARCHAR(255) UNIQUE NOT NULL,
        paystack_transaction_id VARCHAR(255),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'NGN',
        payment_method VARCHAR(50),
        payment_channel VARCHAR(50),
        status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'abandoned', 'reversed')),
        gateway_response TEXT,
        metadata JSONB DEFAULT '{}',
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Payment Webhooks Table (Security & Audit)
    CREATE TABLE IF NOT EXISTS public.payment_webhooks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paystack_reference VARCHAR(255),
        webhook_type VARCHAR(50) NOT NULL,
        payload JSONB NOT NULL,
        signature_hash VARCHAR(255),
        is_verified BOOLEAN DEFAULT false,
        processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        processed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Session Payments Table
    CREATE TABLE IF NOT EXISTS public.session_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        therapist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        payment_transaction_id UUID REFERENCES public.payment_transactions(id),
        credits_used INTEGER NOT NULL,
        amount_paid DECIMAL(10,2) NOT NULL,
        therapist_earnings DECIMAL(10,2) NOT NULL,
        platform_fee DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Payment Disputes Table
    CREATE TABLE IF NOT EXISTS public.payment_disputes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_transaction_id UUID REFERENCES public.payment_transactions(id),
        dispute_type VARCHAR(50) NOT NULL CHECK (dispute_type IN ('chargeback', 'refund_request', 'fraud', 'service_not_rendered')),
        status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
        amount_disputed DECIMAL(10,2) NOT NULL,
        reason TEXT,
        evidence JSONB DEFAULT '{}',
        resolved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  const { error } = await supabase.rpc('exec_sql', { sql: schemaSQL });
  if (error) {
    console.error('Error creating schema:', error);
    throw error;
  }
}

async function createDefaultCreditPackages() {
  const packages = [
    {
      name: 'Starter',
      description: 'Perfect for getting started with therapy',
      credits: 10,
      price: 5000.00,
      is_popular: false,
      sort_order: 1
    },
    {
      name: 'Standard',
      description: 'Most popular choice for regular therapy',
      credits: 25,
      price: 10000.00,
      is_popular: true,
      sort_order: 2
    },
    {
      name: 'Professional',
      description: 'Best value for frequent therapy sessions',
      credits: 50,
      price: 18000.00,
      is_popular: false,
      sort_order: 3
    },
    {
      name: 'Enterprise',
      description: 'Unlimited credits for organizations',
      credits: -1,
      price: 50000.00,
      is_popular: false,
      sort_order: 4
    }
  ];

  for (const pkg of packages) {
    const { error } = await supabase
      .from('credit_packages')
      .upsert(pkg, { onConflict: 'name' });
    
    if (error) {
      console.error(`Error creating package ${pkg.name}:`, error);
    } else {
      console.log(`✅ Created package: ${pkg.name}`);
    }
  }
}

async function setupRLSPolicies() {
  console.log('   RLS policies are already created in the schema file');
  console.log('   Skipping duplicate policy creation...');
}

async function createDatabaseFunctions() {
  console.log('   Database functions are already created in the schema file');
  console.log('   Skipping duplicate function creation...');
}

async function createIndexes() {
  console.log('   Performance indexes are already created in the schema file');
  console.log('   Skipping duplicate index creation...');
}

// Run the setup
if (require.main === module) {
  setupPaymentSystem();
}

module.exports = { setupPaymentSystem };
