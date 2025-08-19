'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useTherapistUser } from "@/context/therapist-user-context"
import { Loader2, User } from "lucide-react"

export default function TherapistClientsPage() {
  const { therapistUser } = useTherapistUser()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  // Fetch clients data
  useEffect(() => {
    const fetchClients = async () => {
      if (!therapistUser?.id) return

      try {
        setLoading(true)
        const response = await fetch(`/api/therapist/clients?therapistId=${therapistUser.id}`)
        const data = await response.json()
        
        if (data.clients) {
          setClients(data.clients)
        }
      } catch (error) {
        console.error('Error fetching clients:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [therapistUser?.id])

  const filtered = clients.filter((c) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return c.name.toLowerCase().includes(q)
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Client History</h2>
        <Card className="h-[calc(100vh-12rem)] flex flex-col">
          <CardHeader>
            <CardTitle>Clients</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading clients...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Client History</h2>
      
      <Card className="h-[calc(100vh-12rem)] flex flex-col">
        <CardHeader>
          <CardTitle>Clients ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 overflow-hidden">
          <Input
            placeholder="Search clients..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ScrollArea className="flex-1">
            <div className="space-y-1">
              {filtered.map((c) => (
                <Link
                  key={c.id}
                  href={`/therapist/dashboard/clients/${c.id}`}
                  className={`block w-full text-left flex items-center gap-3 p-3 rounded-md hover:bg-muted/60 transition-colors`}
                >
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">Last seen {c.lastSeen}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.sessions} sessions
                  </div>
                </Link>
              ))}
              {filtered.length === 0 && (
                <div className="text-sm text-muted-foreground p-2">
                  {clients.length === 0 ? "No clients found." : "No clients match your search."}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}


