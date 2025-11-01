'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import AdminSidebar only for dashboard routes (lazy load to avoid webpack issues on public routes)
const AdminSidebar = dynamic(
  () => import("@/components/admin/admin-sidebar").then(mod => ({ default: mod.AdminSidebar })),
  { 
    ssr: false,
    loading: () => <div className="w-64 bg-gray-100" />
  }
)

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Public routes that shouldn't have the sidebar layout
  const publicRoutes = [
    '/admin/login',
    '/admin/register',
    '/admin/signup',
    '/admin/enroll',
  ]
  
  // Check if this is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname?.startsWith(route + '/')
  )
  
  // If it's a public route, render without sidebar
  if (isPublicRoute) {
    return <>{children}</>
  }
  
  // Otherwise, render with sidebar for dashboard routes
  return (
    <div className="flex h-screen bg-gray-50">
      <Suspense fallback={<div className="w-64 bg-gray-100" />}>
        <AdminSidebar />
      </Suspense>
      <main className="flex-1 overflow-y-auto">
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  )
}
