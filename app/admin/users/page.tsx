import { UserManagement } from "@/components/admin/user-management"

export default function AdminUsersPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-gray-600 mt-2">
          Manage individual users, view their activity, and handle account issues.
        </p>
      </div>
      
      <UserManagement userType="individual" />
    </div>
  )
}
