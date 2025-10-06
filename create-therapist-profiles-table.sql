-- Create therapist_profiles table
CREATE TABLE IF NOT EXISTS public.therapist_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    mdcn_code VARCHAR(50) NOT NULL,
    specialization TEXT,
    languages TEXT,
    phone VARCHAR(20),
    bio TEXT,
    experience_years INTEGER DEFAULT 0,
    hourly_rate DECIMAL(10,2) DEFAULT 0.00,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    is_verified BOOLEAN DEFAULT FALSE,
    profile_image_url TEXT,
    education TEXT,
    certifications TEXT,
    availability_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(mdcn_code)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_user_id ON public.therapist_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_verification_status ON public.therapist_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_mdcn_code ON public.therapist_profiles(mdcn_code);

-- Enable Row Level Security
ALTER TABLE public.therapist_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Therapists can view their own profile" ON public.therapist_profiles
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Therapists can update their own profile" ON public.therapist_profiles
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Therapists can insert their own profile" ON public.therapist_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all therapist profiles" ON public.therapist_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can update all therapist profiles" ON public.therapist_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text 
            AND user_type = 'admin'
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_therapist_profiles_updated_at 
    BEFORE UPDATE ON public.therapist_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- INSERT INTO public.therapist_profiles (user_id, mdcn_code, specialization, languages, phone, bio, experience_years, hourly_rate)
-- SELECT 
--     id,
--     'MDCN' || LPAD((ROW_NUMBER() OVER())::text, 6, '0'),
--     'General Therapy, Anxiety Management',
--     'English, Yoruba',
--     '+234' || LPAD((8000000000 + ROW_NUMBER() OVER())::text, 10, '0'),
--     'Experienced therapist specializing in anxiety and stress management.',
--     FLOOR(RANDOM() * 15) + 2,
--     ROUND((RANDOM() * 5000 + 2000)::numeric, 2)
-- FROM public.users 
-- WHERE user_type = 'therapist'
-- ON CONFLICT (user_id) DO NOTHING;
