import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  // Default data in case context is not available during build
  const user = {
    name: "John Doe",
    email: "john@example.com"
  }

  const name = user.name
  const email = user.email
  const therapyPreferences = "CBT, stress management, anxiety."

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue={name} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={email} disabled />
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
          <form className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="preferences">Your Therapy Preferences</Label>
              <Textarea
                id="preferences"
                placeholder="e.g., I prefer a therapist specializing in CBT for anxiety, or someone who focuses on mindfulness."
                defaultValue={therapyPreferences}
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
