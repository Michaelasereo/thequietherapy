import { NextRequest, NextResponse } from 'next/server'
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  setupPresetCategories 
} from '@/lib/content-management'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getSession()
    if (!session || session.userType !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const categories = await getCategories()

    return NextResponse.json({
      success: true,
      categories
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getSession()
    if (!session || session.userType !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { name, description, action } = await req.json()

    // Handle setup preset categories
    if (action === 'setup_presets') {
      const result = await setupPresetCategories()
      return NextResponse.json(result)
    }

    // Validate required fields for creating category
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      )
    }

    // Create category
    const result = await createCategory(name, description)

    if (result.success) {
      return NextResponse.json({ success: true, categoryId: result.categoryId })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getSession()
    if (!session || session.userType !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { categoryId, updates } = await req.json()

    if (!categoryId || !updates) {
      return NextResponse.json(
        { success: false, error: 'Category ID and updates are required' },
        { status: 400 }
      )
    }

    const result = await updateCategory(categoryId, updates)

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getSession()
    if (!session || session.userType !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId')

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      )
    }

    const result = await deleteCategory(categoryId)

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
