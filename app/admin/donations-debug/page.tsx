"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react"

interface Donation {
  id: string
  amount: number
  donor_name: string
  email: string
  status: string
  reference: string
  created_at: string
  verified_at: string | null
  timeSinceCreated: number
  hasWebhookResponse: boolean
}

interface DebugData {
  success: boolean
  timestamp: string
  summary: {
    totalDonations: number
    statusBreakdown: {
      success: number
      pending: number
      failed: number
      cancelled: number
    }
    successfulAmount: number
    pendingAmount: number
    uniqueSuccessfulDonors: number
    lastDonation: any
  }
  donations: Donation[]
}

export default function DonationsDebugPage() {
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchDebugData = async () => {
    try {
      const response = await fetch('/api/donations/debug', {
        cache: 'no-cache'
      })
      const data = await response.json()
      setDebugData(data)
      setLastUpdate(new Date())
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching debug data:', error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()

    if (autoRefresh) {
      const interval = setInterval(fetchDebugData, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusBadge = (status: string) => {
    const styles = {
      success: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      pending: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      failed: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
      cancelled: { variant: "outline" as const, icon: AlertCircle, color: "text-gray-600" }
    }
    const style = styles[status as keyof typeof styles] || styles.pending
    const Icon = style.icon
    
    return (
      <Badge variant={style.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatTimeSince = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s ago`
    return `${seconds}s ago`
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (!debugData?.success) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Debug Data</CardTitle>
            <CardDescription className="text-red-600">
              Failed to fetch donation debug information
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Donations Debug Console</h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring of donation payments and database updates
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
          </Button>
          <Button onClick={fetchDebugData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Live Indicator */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="font-semibold">
                  {autoRefresh ? 'Live Monitoring' : 'Paused'}
                </span>
              </div>
              <span className="text-sm text-gray-600">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Refreshing every 5 seconds
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Successful Donations</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              ₦{debugData.summary.successfulAmount.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              {debugData.summary.statusBreakdown.success} payments • {debugData.summary.uniqueSuccessfulDonors} donors
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Payments</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              ₦{debugData.summary.pendingAmount.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              {debugData.summary.statusBreakdown.pending} waiting for confirmation
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Failed Payments</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {debugData.summary.statusBreakdown.failed}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              Payment declined or error
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Donations</CardDescription>
            <CardTitle className="text-3xl">
              {debugData.summary.totalDonations}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              All time
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Donations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Donations (Last 50)</CardTitle>
          <CardDescription>
            Live view of all donation transactions and their statuses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Amount</th>
                  <th className="text-left p-3 font-semibold">Donor</th>
                  <th className="text-left p-3 font-semibold">Email</th>
                  <th className="text-left p-3 font-semibold">Created</th>
                  <th className="text-left p-3 font-semibold">Verified</th>
                  <th className="text-left p-3 font-semibold">Webhook</th>
                </tr>
              </thead>
              <tbody>
                {debugData.donations.map((donation) => (
                  <tr key={donation.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      {getStatusBadge(donation.status)}
                    </td>
                    <td className="p-3 font-semibold">
                      ₦{donation.amount.toLocaleString()}
                    </td>
                    <td className="p-3">{donation.donor_name}</td>
                    <td className="p-3 text-sm text-gray-600">
                      {donation.email.replace(/(.{3}).*(@.*)/, '$1***$2')}
                    </td>
                    <td className="p-3 text-sm">
                      <div>{formatTime(donation.created_at)}</div>
                      <div className="text-xs text-gray-500">
                        {formatTimeSince(donation.timeSinceCreated)}
                      </div>
                    </td>
                    <td className="p-3 text-sm">
                      {donation.verified_at ? (
                        <div className="text-green-600">
                          ✓ {formatTime(donation.verified_at)}
                        </div>
                      ) : (
                        <div className="text-yellow-600">
                          ⏳ Waiting...
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {donation.hasWebhookResponse ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          ✓ Received
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          ⏳ Pending
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-blue-900">Debug Console Notes:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li><strong>Success:</strong> Payment completed and verified by Paystack webhook</li>
              <li><strong>Pending:</strong> Payment initiated but not yet confirmed (waiting for webhook)</li>
              <li><strong>Failed:</strong> Payment was declined or encountered an error</li>
              <li><strong>Webhook:</strong> Shows if Paystack has sent confirmation data</li>
            </ul>
            <p className="text-blue-700 mt-3">
              💡 Only <strong>successful</strong> donations are counted in the public stats
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

