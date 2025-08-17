-- Update CMS Tables to Support Custom Categories
-- This script can be run if you need to update existing tables

-- The existing tables already support custom categories since the category field is VARCHAR(100)
-- This script just adds some helpful comments and ensures the structure is optimal

-- Add comments to existing tables to document custom category support
COMMENT ON COLUMN blog_posts.category IS 'Custom categories allowed - users can enter any category name';
COMMENT ON COLUMN faqs.category IS 'Custom categories allowed - users can enter any category name';

-- Optional: Create a view to see all unique categories currently in use
CREATE OR REPLACE VIEW blog_categories AS
SELECT DISTINCT category, COUNT(*) as post_count
FROM blog_posts 
GROUP BY category 
ORDER BY post_count DESC;

CREATE OR REPLACE VIEW faq_categories AS
SELECT DISTINCT category, COUNT(*) as faq_count
FROM faqs 
GROUP BY category 
ORDER BY faq_count DESC;

-- Optional: Create a function to get all unique categories
CREATE OR REPLACE FUNCTION get_blog_categories()
RETURNS TABLE(category_name TEXT) AS $$
BEGIN
    RETURN QUERY SELECT DISTINCT category::TEXT FROM blog_posts ORDER BY category;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_faq_categories()
RETURNS TABLE(category_name TEXT) AS $$
BEGIN
    RETURN QUERY SELECT DISTINCT category::TEXT FROM faqs ORDER BY category;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM get_blog_categories();
-- SELECT * FROM get_faq_categories();
