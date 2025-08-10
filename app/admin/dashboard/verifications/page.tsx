"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, CheckCircle, XCircle, Clock, UserCheck, Building2 } from "lucide-react"

// Mock verification data
const mockVerifications = [
  {
    id: "v1",
    type: "therapist",
    name: "Dr. Emily White",
    email: "emily@example.com",
    submitted: "2024-01-15",
    status: "pending",
    documents: ["Medical License", "ID Card", "Professional Certificate"],
    notes: "All documents appear to be in order. MDCN verification pending."
  },
  {
    id: "v2",
    type: "therapist",
    name: "Dr. Michael Brown",
    email: "michael@example.com",
    submitted: "2024-01-14",
    status: "pending",
    documents: ["Medical License", "ID Card"],
    notes: "Missing professional certificate. Follow up required."
  },
  {
    id: "v3",
    type: "partner",
    name: "HealthCorp Ltd",
    email: "admin@healthcorp.com",
    submitted: "2024-01-13",
    status: "pending",
    documents: ["CAC Registration", "Business License", "Tax Certificate"],
    notes: "Institution verification in progress. Meeting scheduled for next week."
  },
  {
    id: "v4",
    type: "therapist",
    name: "Dr. Sarah Johnson",
    email: "sarah@example.com",
    submitted: "2024-01-12",
    status: "approved",
    documents: ["Medical License", "ID Card", "Professional Certificate"],
    notes: "All documents verified. Account activated."
  },
  {
    id: "v5",
    type: "partner",
    name: "TechCorp Solutions",
    email: "admin@techcorp.com",
    submitted: "2024-01-11",
    status: "rejected",
    documents: ["CAC Registration"],
    notes: "Insufficient documentation. Business license required."
  }
]

export default function AdminVerificationsPage() {
  const pendingVerifications = mockVerifications.filter(v => v.status === "pending")
  const approvedVerifications = mockVerifications.filter(v => v.status === "approved")
  const rejectedVerifications = mockVerifications.filter(v => v.status === "rejected")

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending Review</Badge>
      case "approved":
        return <Badge variant="default">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    return type === "therapist" ? <UserCheck className="h-4 w-4" /> : <Building2 className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Verification Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and manage pending verifications</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{pendingVerifications.length}</div>
                <div className="text-sm text-muted-foreground">Pending Review</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{approvedVerifications.length}</div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{rejectedVerifications.length}</div>
                <div className="text-sm text-muted-foreground">Rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {mockVerifications.filter(v => v.type === "therapist").length}
                </div>
                <div className="text-sm text-muted-foreground">Therapist Verifications</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verifications Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingVerifications.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedVerifications.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedVerifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingVerifications.map((verification) => (
            <Card key={verification.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(verification.type)}
                      <h3 className="font-semibold">{verification.name}</h3>
                      <Badge variant="outline">{verification.type}</Badge>
                      {getStatusBadge(verification.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{verification.email}</p>
                    <p className="text-sm text-muted-foreground">Submitted: {verification.submitted}</p>
                    
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-1">Documents Submitted:</p>
                      <div className="flex flex-wrap gap-1">
                        {verification.documents.map((doc, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-1">Notes:</p>
                      <p className="text-sm text-muted-foreground">{verification.notes}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="default">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive">
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button size="sm" variant="outline">
                      Request More Info
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedVerifications.map((verification) => (
            <Card key={verification.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(verification.type)}
                      <h3 className="font-semibold">{verification.name}</h3>
                      <Badge variant="outline">{verification.type}</Badge>
                      {getStatusBadge(verification.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{verification.email}</p>
                    <p className="text-sm text-muted-foreground">Submitted: {verification.submitted}</p>
                    <p className="text-sm text-muted-foreground">{verification.notes}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedVerifications.map((verification) => (
            <Card key={verification.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(verification.type)}
                      <h3 className="font-semibold">{verification.name}</h3>
                      <Badge variant="outline">{verification.type}</Badge>
                      {getStatusBadge(verification.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{verification.email}</p>
                    <p className="text-sm text-muted-foreground">Submitted: {verification.submitted}</p>
                    <p className="text-sm text-muted-foreground">{verification.notes}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    <Button size="sm" variant="default">
                      Reconsider
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
