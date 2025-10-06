import { UserManagement } from "@/components/admin/user-management"

export default function AdminPartnersPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Partner Management</h1>
        <p className="text-gray-600 mt-2">
          Manage partner organizations, monitor employee usage, and handle corporate accounts.
        </p>
      </div>
      
      <UserManagement userType="partner" />
    </div>
  )
}
