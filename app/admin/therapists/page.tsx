import { UserManagement } from "@/components/admin/user-management"

export default function AdminTherapistsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Therapist Management</h1>
        <p className="text-gray-600 mt-2">
          Manage therapist accounts, approve applications, and monitor their activity.
        </p>
      </div>
      
      <UserManagement userType="therapist" />
    </div>
  )
}
