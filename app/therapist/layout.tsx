import type React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function TherapistRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Authentication check for therapist side
  const cookieStore = await cookies()
  const therapistUserCookie = cookieStore.get("trpi_therapist_user")?.value
  const isAuthenticated = therapistUserCookie ? true : false

  console.log("Therapist Layout - isAuthenticated:", isAuthenticated)
  console.log("Therapist Layout - therapistUserCookie:", therapistUserCookie ? "Cookie found" : "Cookie NOT found")

  if (!isAuthenticated) {
    redirect("/therapist/login")
  }

  return <>{children}</>
}
