import type React from "react"

export default function TherapistRootLayout({ children }: { children: React.ReactNode }) {
  // Minimal layout for therapist routes; dashboard adds its own shell
  return <>{children}</>
}
