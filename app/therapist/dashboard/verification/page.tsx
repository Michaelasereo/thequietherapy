"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

export default function TherapistVerificationPage() {
  const [licenseStatus, setLicenseStatus] = useState<"pending" | "verified">("pending")
  const [idStatus, setIdStatus] = useState<"pending" | "verified">("pending")

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Verification</h2>

      {/* License Verification */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>
            License Verification {" "}
            <Badge variant={licenseStatus === "verified" ? "default" : "secondary"}>
              {licenseStatus === "verified" ? "Verified" : "Pending"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" />
          <div className="flex gap-2">
            <Button onClick={() => setLicenseStatus("pending")} variant="outline">Submit for Review</Button>
            <Button onClick={() => setLicenseStatus("verified")}>Mark Verified (demo)</Button>
          </div>
        </CardContent>
      </Card>

      {/* ID Verification */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>
            ID Verification {" "}
            <Badge variant={idStatus === "verified" ? "default" : "secondary"}>
              {idStatus === "verified" ? "Verified" : "Pending"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" />
          <div className="flex gap-2">
            <Button onClick={() => setIdStatus("pending")} variant="outline">Submit for Review</Button>
            <Button onClick={() => setIdStatus("verified")}>Mark Verified (demo)</Button>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Bio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input placeholder="Full name" defaultValue="Demo Therapist" />
            <Input placeholder="Age" defaultValue="40" />
            <Input placeholder="Gender" defaultValue="Male" />
            <Input placeholder="Marital status" defaultValue="Married" />
            <Input placeholder="Specialty" defaultValue="CBT, Trauma-Informed" />
          </div>
          <Textarea placeholder="Short bio summary" defaultValue="Licensed therapist with MBA in Psychology. Passionate about client-centered care and evidence-based practice." />
          <div className="flex justify-end">
            <Button>Save Bio</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



