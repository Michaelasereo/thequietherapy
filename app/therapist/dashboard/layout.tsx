import type React from "react"

export default function TherapistDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('🔍 TherapistDashboardLayout: Rendering')
  
  // No need to wrap in providers - they're already in the parent layout
  return <>{children}</>;
}
