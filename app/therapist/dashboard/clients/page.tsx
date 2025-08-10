import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export default function TherapistClientsPage() {
  // Default data in case imports are not available during build
  const therapistClients = [
    {
      id: "1",
      name: "Sarah Johnson",
      picture: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      lastSeen: "2 days ago",
      sessions: [
        { id: "s1", date: "2024-09-15", type: "CBT" },
        { id: "s2", date: "2024-09-08", type: "CBT" }
      ]
    },
    {
      id: "2",
      name: "Michael Chen",
      picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      lastSeen: "1 week ago",
      sessions: [
        { id: "s3", date: "2024-09-10", type: "Trauma Therapy" },
        { id: "s4", date: "2024-09-03", type: "Trauma Therapy" }
      ]
    },
    {
      id: "3",
      name: "Lisa Wang",
      picture: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      lastSeen: "3 days ago",
      sessions: [
        { id: "s5", date: "2024-09-12", type: "Mindfulness" }
      ]
    }
  ]

  const query = ""
  const selectedId = null

  const filtered = therapistClients.filter((c) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return c.name.toLowerCase().includes(q)
  })

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
            defaultValue={query}
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


