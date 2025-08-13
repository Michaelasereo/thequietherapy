"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Shield, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useActionState } from "react"

export default function AdminAuthPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Simple admin login function
  const handleLogin = async () => {
    console.log("Login button clicked!") // Debug log
    alert("Login function called!") // Simple alert to test
    
    if (!email || !password) {
      console.log("Missing credentials") // Debug log
      toast({
        title: "Missing credentials",
        description: "Please enter your email and password.",
        variant: "destructive",
      })
      return
    }

    console.log("Checking credentials:", email, password) // Debug log

    // Check admin credentials
    if (email === "admin@trpi.com" && password === "admin123") {
      console.log("Credentials valid, setting session") // Debug log
      
      // Set admin session in localStorage for demo
      localStorage.setItem("trpi_admin_user", JSON.stringify({
        id: "admin-1",
        email: email,
        role: "admin",
        name: "Admin User"
      }))

      toast({
        title: "Login Successful",
        description: "Redirecting to admin dashboard...",
      })
      
      console.log("Redirecting to admin dashboard...") // Debug log
      setTimeout(() => {
        window.location.href = "/admin/dashboard"
      }, 1000)
    } else {
      console.log("Invalid credentials") // Debug log
      toast({
        title: "Login Failed",
        description: "Invalid admin credentials.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Admin Portal</h1>
          </div>
          <p className="text-muted-foreground">Access the Trpi platform administration dashboard</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@trpi.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              onClick={handleLogin} 
              className="w-full mt-4"
              type="submit"
            >
              Sign In to Admin Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
          
          {/* Test button to verify button component works */}
          <Button 
            onClick={() => console.log("Test button clicked!")} 
            variant="outline"
            className="w-full"
            type="button"
          >
            Test Button (Click to verify buttons work)
          </Button>
          
          {/* Test button to verify button component works */}
          <Button 
            onClick={() => console.log("Test button clicked!")} 
            variant="outline"
            className="w-full"
            type="button"
          >
            Test Button (Click to verify buttons work)
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Demo: admin@trpi.com / admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
