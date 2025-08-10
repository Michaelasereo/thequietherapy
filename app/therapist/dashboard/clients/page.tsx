"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { therapistClients } from "@/lib/therapist-data"

export default function TherapistClientsPage() {
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return therapistClients
    return therapistClients.filter((c) => c.name.toLowerCase().includes(q))
  }, [query])

  const selected = therapistClients.find((c) => c.id === selectedId) || null

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Client History</h2>
      
      <Card className="h-[calc(100vh-12rem)] flex flex-col">
        <CardHeader>
          <CardTitle>Clients</CardTitle>
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.picture} alt={c.name} className="h-12 w-12 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">Last seen {c.lastSeen}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.sessions.length} sessions
                  </div>
                </Link>
              ))}
              {filtered.length === 0 && (
                <div className="text-sm text-muted-foreground p-2">No clients found.</div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}


