"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/context/user-context"
import { useState } from "react"

export default function SettingsPage() {
  const { user } = useUser()
  const { toast } = useToast()

  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [therapyPreferences, setTherapyPreferences] = useState("CBT, stress management, anxiety.")

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate API call to update profile
    toast({
      title: "Profile Updated!",
      description: "Your profile information has been saved.",
    })
  }

  const handlePreferencesSave = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate API call to update preferences
    toast({
      title: "Preferences Saved!",
      description: "Your therapy preferences have been updated.",
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled />
              <p className="text-sm text-muted-foreground">Email cannot be changed.</p>
            </div>
            <Button type="submit">Save Profile</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Therapy Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePreferencesSave} className="space-y-4">
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
            <Button type="submit">Save Preferences</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
