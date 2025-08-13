"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function TestLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const testUsers = [
    {
      email: "testuser@example.com",
      name: "John Doe",
      type: "individual",
      description: "Regular user dashboard",
      credits: 50,
      package: "Basic"
    },
    {
      email: "asereope.partner@gmail.com",
      name: "Michael Asere (Partner)",
      type: "partner",
      description: "Partner organization dashboard",
      credits: 1000,
      package: "Enterprise"
    },
    {
      email: "asereope@gmail.com",
      name: "Dr. Michael Asere",
      type: "therapist",
      description: "Therapist professional dashboard",
      credits: 500,
      package: "Professional"
    }
  ]

  const handleLogin = async (user: any) => {
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login successful:", data)
        setCurrentUser(data.user)
        
        // Determine redirect URL based on user type from API response
        let redirectUrl = "/dashboard"; // default
        switch (data.user.user_type) {
          case "individual":
            redirectUrl = "/dashboard";
            break;
          case "therapist":
            redirectUrl = "/therapist/dashboard";
            break;
          case "partner":
            redirectUrl = "/partner/dashboard";
            break;
          case "admin":
            redirectUrl = "/admin/dashboard";
            break;
          default:
            redirectUrl = "/dashboard";
        }
        
        setTimeout(() => {
          router.push(redirectUrl)
        }, 1000)
      } else {
        alert(data.error || "Login failed. Please try again.")
      }
    } catch (error) {
      console.error("Login error:", error)
      alert("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">🧪 Development Test Login</CardTitle>
            <CardDescription>
              Test different user roles and dashboards
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentUser && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800">✅ Logged in as:</h3>
                <p className="font-semibold text-green-700">{currentUser.full_name} ({currentUser.user_type})</p>
                <p className="text-green-600">Redirecting to dashboard...</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testUsers.map((user, index) => (
                <Card key={index} className="border-2 hover:border-blue-300 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <Badge variant={user.type === "individual" ? "default" : user.type === "partner" ? "secondary" : "outline"}>
                        {user.type}
                      </Badge>
                    </div>
                    <CardDescription>{user.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-muted-foreground">
                        <strong>Email:</strong> {user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Credits:</strong> {user.credits}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Package:</strong> {user.package}
                      </p>
                    </div>
                    <Button 
                      onClick={() => handleLogin(user)} 
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? "Logging in..." : `Login as ${user.type}`}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800">⚠️ Development Only</h3>
              <p className="text-yellow-700 text-sm">
                This page is for development testing only. It bypasses normal authentication 
                and creates test sessions for different user roles.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
