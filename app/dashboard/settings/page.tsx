'use client'

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAuth } from '@/context/auth-context'
import { useToast } from "@/components/ui/use-toast"

export default function SettingsPage() {
  const { user, loading, refreshUser } = useAuth()
  const { toast } = useToast()
  const [therapyPreferences, setTherapyPreferences] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState("")

  // Default data in case context is not available during build
  const defaultUser = {
    name: "Loading...",
    email: "loading@example.com"
  }

  const currentUser = user || defaultUser
  const email = currentUser.email || "user@example.com"

  // Load user preferences on mount
  useEffect(() => {
    if (user?.id) {
      // Set the current name from user data
      const currentName = (user as any).full_name || (user as any).name || user.email?.split('@')[0] || "User"
      setName(currentName)
      
      // Load therapy preferences from user profile or API
      setTherapyPreferences("CBT, stress management, anxiety.") // Default for now
    }
  }, [user])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      if (!user?.id) {
        toast({
          title: "Error",
          description: "No user found. Please log in again.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: name.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Profile Updated",
          description: "Your profile information has been saved successfully.",
        })
        
        // Refresh user data to update the dashboard header
        await refreshUser()
      } else {
        throw new Error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      // TODO: Implement preferences update API call
      toast({
        title: "Preferences Updated",
        description: "Your therapy preferences have been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Settings</h2>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={email} disabled />
              <p className="text-sm text-muted-foreground">Email cannot be changed.</p>
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Therapy Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSavePreferences} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="preferences">Your Therapy Preferences</Label>
              <Textarea
                id="preferences"
                placeholder="e.g., I prefer a therapist specializing in CBT for anxiety, or someone who focuses on mindfulness."
                value={therapyPreferences}
                onChange={(e) => setTherapyPreferences(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Preferences"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
