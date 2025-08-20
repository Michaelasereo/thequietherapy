import { supabase } from '@/lib/supabase'

export interface ContentCategory {
  id: string
  name: string
  slug: string
  description?: string
  is_preset: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  category_id: string
  author_id: string
  status: 'draft' | 'published' | 'archived'
  featured_image?: string
  meta_title?: string
  meta_description?: string
  published_at?: string
  created_at: string
  updated_at: string
  category?: ContentCategory
  author?: {
    id: string
    full_name: string
    email: string
  }
}

export interface FAQ {
  id: string
  question: string
  answer: string
  category_id: string
  order: number
  is_active: boolean
  created_at: string
  updated_at: string
  category?: ContentCategory
}

// Initialize preset categories
export const PRESET_CATEGORIES = [
  {
    name: 'Mental Health',
    slug: 'mental-health',
    description: 'Articles and FAQs about mental health topics'
  },
  {
    name: 'Therapy & Counseling',
    slug: 'therapy-counseling',
    description: 'Information about therapy approaches and counseling'
  },
  {
    name: 'Wellness & Self-Care',
    slug: 'wellness-self-care',
    description: 'Tips and guides for wellness and self-care practices'
  },
  {
    name: 'Platform Guide',
    slug: 'platform-guide',
    description: 'How-to guides and platform information'
  },
  {
    name: 'Professional Development',
    slug: 'professional-development',
    description: 'Resources for therapists and mental health professionals'
  }
]

// Setup preset categories
export async function setupPresetCategories(): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if preset categories already exist
    const { data: existingCategories, error: checkError } = await supabase
      .from('content_categories')
      .select('slug')
      .eq('is_preset', true)

    if (checkError) {
      console.error('Error checking existing categories:', checkError)
      return { success: false, error: 'Failed to check existing categories' }
    }

    const existingSlugs = existingCategories?.map(cat => cat.slug) || []

    // Insert only missing preset categories
    const categoriesToInsert = PRESET_CATEGORIES.filter(cat => !existingSlugs.includes(cat.slug))

    if (categoriesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('content_categories')
        .insert(categoriesToInsert.map(cat => ({
          ...cat,
          is_preset: true,
          is_active: true
        })))

      if (insertError) {
        console.error('Error inserting preset categories:', insertError)
        return { success: false, error: 'Failed to create preset categories' }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error setting up preset categories:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Get all categories
export async function getCategories(): Promise<ContentCategory[]> {
  try {
    const { data, error } = await supabase
      .from('content_categories')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting categories:', error)
    return []
  }
}

// Create new category
export async function createCategory(
  name: string,
  description?: string
): Promise<{ success: boolean; categoryId?: string; error?: string }> {
  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const { data: existingCategory, error: checkError } = await supabase
      .from('content_categories')
      .select('id')
      .eq('slug', slug)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing category:', checkError)
      return { success: false, error: 'Failed to check existing category' }
    }

    if (existingCategory) {
      return { success: false, error: 'Category with this name already exists' }
    }

    const { data, error } = await supabase
      .from('content_categories')
      .insert({
        name,
        slug,
        description,
        is_preset: false,
        is_active: true
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return { success: false, error: 'Failed to create category' }
    }

    return { success: true, categoryId: data.id }
  } catch (error) {
    console.error('Error creating category:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Update category
export async function updateCategory(
  categoryId: string,
  updates: { name?: string; description?: string; is_active?: boolean }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = { ...updates }

    // If name is being updated, generate new slug
    if (updates.name) {
      const slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      
      // Check if new slug conflicts with existing category
      const { data: existingCategory, error: checkError } = await supabase
        .from('content_categories')
        .select('id')
        .eq('slug', slug)
        .neq('id', categoryId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking slug conflict:', checkError)
        return { success: false, error: 'Failed to check slug conflict' }
      }

      if (existingCategory) {
        return { success: false, error: 'Category with this name already exists' }
      }

      updateData.slug = slug
    }

    const { error } = await supabase
      .from('content_categories')
      .update(updateData)
      .eq('id', categoryId)

    if (error) {
      console.error('Error updating category:', error)
      return { success: false, error: 'Failed to update category' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating category:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Delete category (only non-preset categories)
export async function deleteCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if category is preset
    const { data: category, error: checkError } = await supabase
      .from('content_categories')
      .select('is_preset')
      .eq('id', categoryId)
      .single()

    if (checkError) {
      console.error('Error checking category:', checkError)
      return { success: false, error: 'Category not found' }
    }

    if (category.is_preset) {
      return { success: false, error: 'Cannot delete preset categories' }
    }

    // Check if category has content
    const { data: contentCount, error: contentError } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact' })
      .eq('category_id', categoryId)

    if (contentError) {
      console.error('Error checking category content:', contentError)
      return { success: false, error: 'Failed to check category content' }
    }

    if (contentCount && contentCount.length > 0) {
      return { success: false, error: 'Cannot delete category with existing content' }
    }

    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabase
      .from('content_categories')
      .update({ is_active: false })
      .eq('id', categoryId)

    if (deleteError) {
      console.error('Error deleting category:', deleteError)
      return { success: false, error: 'Failed to delete category' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting category:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Create blog post
export async function createBlogPost(
  postData: {
    title: string
    content: string
    excerpt: string
    category_id: string
    author_id: string
    status: 'draft' | 'published'
    featured_image?: string
    meta_title?: string
    meta_description?: string
  }
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const slug = postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const { data: existingPost, error: checkError } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing post:', checkError)
      return { success: false, error: 'Failed to check existing post' }
    }

    if (existingPost) {
      return { success: false, error: 'Blog post with this title already exists' }
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        ...postData,
        slug,
        published_at: postData.status === 'published' ? new Date().toISOString() : null
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating blog post:', error)
      return { success: false, error: 'Failed to create blog post' }
    }

    return { success: true, postId: data.id }
  } catch (error) {
    console.error('Error creating blog post:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Get blog posts
export async function getBlogPosts(
  filters?: {
    status?: 'draft' | 'published' | 'archived'
    category_id?: string
    author_id?: string
  }
): Promise<BlogPost[]> {
  try {
    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        category:content_categories (
          id,
          name,
          slug
        ),
        author:users (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    if (filters?.author_id) {
      query = query.eq('author_id', filters.author_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching blog posts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting blog posts:', error)
    return []
  }
}

// Create FAQ
export async function createFAQ(
  faqData: {
    question: string
    answer: string
    category_id: string
    order: number
  }
): Promise<{ success: boolean; faqId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .insert({
        ...faqData,
        is_active: true
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating FAQ:', error)
      return { success: false, error: 'Failed to create FAQ' }
    }

    return { success: true, faqId: data.id }
  } catch (error) {
    console.error('Error creating FAQ:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Get FAQs
export async function getFAQs(
  filters?: {
    category_id?: string
    is_active?: boolean
  }
): Promise<FAQ[]> {
  try {
    let query = supabase
      .from('faqs')
      .select(`
        *,
        category:content_categories (
          id,
          name,
          slug
        )
      `)
      .order('order', { ascending: true })

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching FAQs:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting FAQs:', error)
    return []
  }
}

// Update FAQ
export async function updateFAQ(
  faqId: string,
  updates: {
    question?: string
    answer?: string
    category_id?: string
    order?: number
    is_active?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('faqs')
      .update(updates)
      .eq('id', faqId)

    if (error) {
      console.error('Error updating FAQ:', error)
      return { success: false, error: 'Failed to update FAQ' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating FAQ:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Delete FAQ
export async function deleteFAQ(faqId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', faqId)

    if (error) {
      console.error('Error deleting FAQ:', error)
      return { success: false, error: 'Failed to delete FAQ' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting FAQ:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Get blog post by slug
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        category:content_categories (
          id,
          name,
          slug
        ),
        author:users (
          id,
          full_name,
          email
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error) {
      console.error('Error fetching blog post:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error getting blog post:', error)
    return null
  }
}

// Get FAQs by category slug
export async function getFAQsByCategorySlug(categorySlug: string): Promise<FAQ[]> {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .select(`
        *,
        category:content_categories (
          id,
          name,
          slug
        )
      `)
      .eq('category.slug', categorySlug)
      .eq('is_active', true)
      .order('order', { ascending: true })

    if (error) {
      console.error('Error fetching FAQs by category:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting FAQs by category:', error)
    return []
  }
}
