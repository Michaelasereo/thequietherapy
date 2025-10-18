"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  UserCheck, 
  Building2, 
  Clock, 
  Mail, 
  Phone, 
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Users
} from "lucide-react"
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface PendingVerification {
  id: string
  full_name: string
  email: string
  phone?: string
  mdcn_code?: string
  specialization?: string[]
  languages?: string[]
  status: string
  created_at: string
  submitted_at: string
  type?: 'therapist' | 'partner'
}

interface PendingVerificationsCardProps {
  className?: string
}

export default function PendingVerificationsCard({ className }: PendingVerificationsCardProps) {
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'therapist' | 'partner'>('all')
  const router = useRouter()

  useEffect(() => {
    fetchPendingVerifications()
  }, [])

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true)
      // Add cache busting to ensure fresh data
      const response = await fetch(`/api/admin/pending-verifications?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('📋 Fetched pending verifications:', data.length)
        // Add type information based on data structure
        const verificationsWithType = data.map((item: PendingVerification) => ({
          ...item,
          type: item.mdcn_code ? 'therapist' : 'partner' as 'therapist' | 'partner'
        }))
        setPendingVerifications(verificationsWithType)
      } else {
        toast.error('Failed to fetch pending verifications')
      }
    } catch (error) {
      console.error('Error fetching pending verifications:', error)
      toast.error('Error loading pending verifications')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = (verification: PendingVerification) => {
    if (verification.type === 'therapist') {
      router.push(`/admin/dashboard/therapists?review=${verification.id}`)
    } else {
      router.push(`/admin/dashboard/partners?review=${verification.id}`)
    }
  }

  const handleQuickApprove = async (verification: PendingVerification) => {
    try {
      console.log('🔍 Approving verification:', verification.id, verification.full_name)
      
      const response = await fetch(`/api/admin/approve-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: verification.id,
          type: verification.type,
          action: 'approve'
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Approval successful:', result)
        
        toast.success(`${verification.type === 'therapist' ? 'Therapist' : 'Partner'} approved successfully (including availability)`)
        
        // Remove the approved item from the list immediately for better UX
        setPendingVerifications(prev => prev.filter(v => v.id !== verification.id))
        
        // Then refresh after a delay to ensure database sync
        setTimeout(() => {
          console.log('🔄 Refreshing pending verifications list...')
          fetchPendingVerifications()
        }, 1000)
      } else {
        const errorData = await response.json()
        console.error('❌ Approval failed:', errorData)
        toast.error(errorData.error || 'Failed to approve verification')
      }
    } catch (error) {
      console.error('❌ Error approving verification:', error)
      toast.error('Error approving verification')
    }
  }

  const handleQuickReject = async (verification: PendingVerification) => {
    try {
      const response = await fetch(`/api/admin/approve-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: verification.id,
          type: verification.type,
          action: 'reject'
        }),
      })

      if (response.ok) {
        toast.success(`${verification.type === 'therapist' ? 'Therapist' : 'Partner'} rejected`)
        fetchPendingVerifications() // Refresh the list
      } else {
        toast.error('Failed to reject verification')
      }
    } catch (error) {
      console.error('Error rejecting verification:', error)
      toast.error('Error rejecting verification')
    }
  }


  const filteredVerifications = pendingVerifications.filter(verification => {
    if (filter === 'all') return true
    return verification.type === filter
  })

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getPriorityColor = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours > 72) return 'text-red-500' // Over 3 days
    if (diffInHours > 48) return 'text-orange-500' // Over 2 days
    if (diffInHours > 24) return 'text-yellow-500' // Over 1 day
    return 'text-green-500' // Less than 1 day
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Pending Verifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-md border animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Pending Verifications
            <Badge variant="secondary" className="ml-2">
              {filteredVerifications.length}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'therapist' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('therapist')}
            >
              <UserCheck className="h-4 w-4 mr-1" />
              Therapists
            </Button>
            <Button
              variant={filter === 'partner' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('partner')}
            >
              <Building2 className="h-4 w-4 mr-1" />
              Partners
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredVerifications.length > 0 ? (
            filteredVerifications.map((verification) => (
              <div key={verification.id} className="flex items-center gap-3 p-4 rounded-lg border hover:shadow-sm transition-shadow">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getInitials(verification.full_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm truncate">{verification.full_name}</h4>
                    <Badge variant={verification.type === 'therapist' ? 'default' : 'secondary'} className="text-xs">
                      {verification.type === 'therapist' ? (
                        <UserCheck className="h-3 w-3 mr-1" />
                      ) : (
                        <Building2 className="h-3 w-3 mr-1" />
                      )}
                      {verification.type === 'therapist' ? 'Therapist' : 'Partner'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{verification.email}</span>
                    </div>
                    {verification.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{verification.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className={getPriorityColor(verification.created_at)}>
                        {getTimeAgo(verification.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  {verification.type === 'therapist' && verification.specialization && (
                    <div className="flex items-center gap-1 mt-1">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {verification.specialization.slice(0, 2).join(', ')}
                        {verification.specialization.length > 2 && '...'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReview(verification)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    Review
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickApprove(verification)}
                    className="flex items-center gap-1 text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickReject(verification)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <XCircle className="h-3 w-3" />
                    Reject
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No pending verifications</p>
              <p className="text-sm text-muted-foreground mt-1">
                {filter === 'all' 
                  ? 'All verifications have been processed'
                  : `No pending ${filter} verifications`
                }
              </p>
            </div>
          )}
        </div>
        
        {filteredVerifications.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing {filteredVerifications.length} of {pendingVerifications.length} pending verifications</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchPendingVerifications}
                className="text-xs"
              >
                Refresh
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
