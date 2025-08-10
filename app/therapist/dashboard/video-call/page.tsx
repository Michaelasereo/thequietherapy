"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TherapistVideoCallPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Video Call</h2>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>In-app Therapy Session (Demo)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This is a placeholder for the embedded video call experience. Integrate your preferred provider
            (e.g., Daily, Twilio, LiveKit, or WebRTC) here.
          </p>
          <div className="flex gap-2">
            <Button>Start Room</Button>
            <Button variant="outline">Join Room</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



