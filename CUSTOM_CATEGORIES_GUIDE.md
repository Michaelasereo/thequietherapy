# Custom Categories for Blog Posts and FAQs

## Overview

The CMS now supports custom categories for both blog posts and FAQs. Instead of being limited to predefined category options, you can now enter any category name you want when creating or editing content.

## What Changed

### 1. Database Structure
- The `category` field in both `blog_posts` and `faqs` tables is a `VARCHAR(100)` that accepts any custom category name
- No changes to the database schema were needed - it already supported this flexibility

### 2. Admin Interface Updates
- **Blog Post Form**: Category field changed from a dropdown to a text input
- **FAQ Form**: Category field changed from a dropdown to a text input
- **Filter Dropdowns**: Now dynamically show existing categories from the database

### 3. API Routes
- No changes needed - the existing API routes already handle custom categories properly

## How to Use Custom Categories

### Creating Content with Custom Categories

1. **Blog Posts**: When creating or editing a blog post, you can enter any category name in the "Category" field
   - Examples: "Mental Health", "Wellness & Self-Care", "Adolescent Psychology", "Trauma Recovery"

2. **FAQs**: When creating or editing an FAQ, you can enter any category name in the "Category" field
   - Examples: "Booking", "Services", "Getting Started", "Mental Health Support"

### Filtering by Categories

- The filter dropdowns in the admin interface will automatically populate with all existing categories
- You can filter by any category that has been used in existing content
- The "All Categories" option shows content from all categories

## Benefits

1. **Flexibility**: No need to predefine categories - create them as needed
2. **Organization**: Group related content with meaningful category names
3. **Scalability**: Add new categories without code changes
4. **User Experience**: Categories can be more specific and relevant to your content

## Example Categories

### Blog Post Categories
- Mental Health
- Family Therapy
- Wellness & Self-Care
- Adolescent Psychology
- Trauma Recovery
- Couples Counseling
- Parenting Support
- Stress Management

### FAQ Categories
- Booking
- Services
- Online Therapy
- Pricing
- Getting Started
- Mental Health Support
- Technical Issues
- Privacy & Security

## Database Views and Functions

The system includes helpful database views and functions:

### Views
- `blog_categories`: Shows all unique blog categories with post counts
- `faq_categories`: Shows all unique FAQ categories with FAQ counts

### Functions
- `get_blog_categories()`: Returns all unique blog categories
- `get_faq_categories()`: Returns all unique FAQ categories

## Migration Notes

If you're updating an existing system:

1. **No database migration required** - the existing structure already supports custom categories
2. **Run the update script** (`update-cms-categories.sql`) to add helpful views and functions
3. **Update the admin interface** - the form changes are already included in the updated code

## Best Practices

1. **Consistency**: Try to use consistent naming conventions for similar categories
2. **Specificity**: Use specific category names that clearly describe the content
3. **Organization**: Group related content under similar category names
4. **Case Sensitivity**: Categories are case-sensitive, so be consistent with capitalization

## Technical Details

- Category field: `VARCHAR(100)` - supports up to 100 characters
- Case-sensitive matching for filtering
- Full-text search includes category names
- Categories are indexed for better performance
