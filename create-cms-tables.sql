-- CMS Database Tables for Blog Posts and FAQs
-- Run this script to create the necessary tables for the content management system

-- Create blog_posts table
-- Note: The category field is a VARCHAR that accepts any custom category name
-- This allows for flexible, user-defined categories rather than predefined options
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- Custom categories allowed
    tags TEXT[], -- Array of tags
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    publish_date TIMESTAMP WITH TIME ZONE,
    views INTEGER DEFAULT 0,
    featured_image VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create faqs table
-- Note: The category field is a VARCHAR that accepts any custom category name
-- This allows for flexible, user-defined categories rather than predefined options
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- Custom categories allowed
    tags TEXT[], -- Array of tags
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    helpful INTEGER DEFAULT 0,
    not_helpful INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author);
CREATE INDEX IF NOT EXISTS idx_blog_posts_publish_date ON blog_posts(publish_date);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at);

CREATE INDEX IF NOT EXISTS idx_faqs_status ON faqs(status);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_created_at ON faqs(created_at);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_search ON blog_posts USING GIN (to_tsvector('english', title || ' ' || content || ' ' || excerpt));
CREATE INDEX IF NOT EXISTS idx_faqs_search ON faqs USING GIN (to_tsvector('english', question || ' ' || answer));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at 
    BEFORE UPDATE ON faqs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for blog posts (demonstrating custom categories)
INSERT INTO blog_posts (title, content, excerpt, author, category, tags, status, publish_date, views) VALUES
(
    'Understanding Anxiety: A Comprehensive Guide',
    'Anxiety is a natural response to stress, but when it becomes overwhelming, it can significantly impact daily life. This comprehensive guide explores the different types of anxiety disorders, their symptoms, and effective treatment approaches including therapy, medication, and lifestyle changes.',
    'Learn about the different types of anxiety, their symptoms, and effective treatment approaches.',
    'Dr. Sarah Johnson',
    'Mental Health',
    ARRAY['anxiety', 'mental-health', 'guide'],
    'published',
    '2024-01-15 10:00:00+00',
    1250
),
(
    'Coping Strategies for Depression',
    'Depression affects millions of people worldwide. Understanding effective coping strategies is crucial for managing symptoms and improving quality of life. This article covers evidence-based approaches including cognitive behavioral therapy, medication, exercise, and social support.',
    'Discover practical techniques to manage depression and improve mental well-being.',
    'Dr. Michael Brown',
    'Mental Health',
    ARRAY['depression', 'coping', 'strategies'],
    'draft',
    NULL,
    0
),
(
    'Family Therapy Techniques',
    'Family therapy is a powerful approach to resolving conflicts and improving relationships. This article explores various family therapy techniques including structural family therapy, strategic family therapy, and narrative therapy approaches.',
    'Explore effective family therapy techniques that can strengthen family bonds.',
    'Dr. Emily White',
    'Family Therapy',
    ARRAY['family', 'therapy', 'techniques'],
    'published',
    '2024-01-12 16:00:00+00',
    2100
),
(
    'Mindfulness in Daily Life',
    'Mindfulness is more than just meditation. This article explores practical ways to incorporate mindfulness into your daily routine, from mindful eating to mindful walking and breathing exercises.',
    'Learn practical mindfulness techniques you can use throughout your day.',
    'Dr. Lisa Chen',
    'Wellness & Self-Care', -- Custom category example
    ARRAY['mindfulness', 'wellness', 'self-care'],
    'published',
    '2024-01-18 14:00:00+00',
    890
),
(
    'Teen Mental Health Challenges',
    'Adolescence brings unique mental health challenges. This article addresses common issues teens face and provides guidance for parents and caregivers on how to support their mental well-being.',
    'Understanding and supporting teen mental health in today''s world.',
    'Dr. James Wilson',
    'Adolescent Psychology', -- Custom category example
    ARRAY['teen', 'adolescent', 'mental-health'],
    'published',
    '2024-01-20 11:00:00+00',
    1560
);

-- Insert sample data for FAQs (demonstrating custom categories)
INSERT INTO faqs (question, answer, category, tags, status, helpful, not_helpful) VALUES
(
    'How do I book my first therapy session?',
    'Booking your first therapy session is simple. You can either call our support line, use our online booking system, or contact us through email. We''ll help you find a therapist that matches your needs and schedule.',
    'Booking',
    ARRAY['booking', 'first-session', 'therapy'],
    'published',
    45,
    2
),
(
    'What types of therapy do you offer?',
    'We offer a wide range of therapy types including Cognitive Behavioral Therapy (CBT), Family Therapy, Couples Therapy, Individual Therapy, and specialized treatments for anxiety, depression, and trauma.',
    'Services',
    ARRAY['therapy-types', 'services', 'treatment'],
    'published',
    67,
    1
),
(
    'Is online therapy as effective as in-person therapy?',
    'Yes, online therapy has been shown to be just as effective as in-person therapy for many conditions. It offers the same level of professional care with added convenience and accessibility.',
    'Online Therapy',
    ARRAY['online-therapy', 'effectiveness', 'virtual'],
    'published',
    89,
    3
),
(
    'How much does therapy cost?',
    'Therapy costs vary depending on the type of session and your insurance coverage. We offer sliding scale fees and accept most major insurance plans. Contact us for specific pricing information.',
    'Pricing',
    ARRAY['cost', 'pricing', 'insurance'],
    'draft',
    0,
    0
),
(
    'What should I expect in my first session?',
    'Your first session is typically an intake session where your therapist will ask about your background, current concerns, and goals for therapy. This helps them understand your needs and develop a treatment plan.',
    'Getting Started', -- Custom category example
    ARRAY['first-session', 'expectations', 'intake'],
    'published',
    34,
    1
),
(
    'How do I know if I need therapy?',
    'Therapy can be beneficial for anyone experiencing emotional distress, relationship issues, life transitions, or wanting personal growth. You don''t need to be in crisis to benefit from therapy.',
    'Mental Health Support', -- Custom category example
    ARRAY['therapy-needs', 'mental-health', 'support'],
    'published',
    78,
    2
);

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON TABLE blog_posts TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE faqs TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
