"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Shield, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function AdminAuthPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = () => {
    if (!email || !password) {
      toast({
        title: "Missing credentials",
        description: "Please enter your email and password.",
        variant: "destructive",
      })
      return
    }

    // Simulate admin login
    toast({
      title: "Login Successful",
      description: "Redirecting to admin dashboard...",
    })
    
    // In real app, redirect to admin dashboard
    setTimeout(() => {
      window.location.href = "/admin/dashboard"
    }, 1000)
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
          <div className="space-y-2">
            <Label htmlFor="email">Admin Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@trpi.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            />
          </div>
          
          <Button onClick={handleLogin} className="w-full">
            Sign In to Admin Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Demo: Use any email and password to login</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
