import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// Recent applications data - moved from lib/data.ts (empty array since applications are fetched from API)
const recentApplications: any[] = []
import Link from "next/link"

export default function RecentApplicationsSection() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">Recent Applications</CardTitle>
        <Button variant="outline" className="bg-transparent">
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center h-[200px] text-center">
        {recentApplications.length === 0 ? (
          <>
            <p className="text-muted-foreground mb-4">No applications yet</p>
            <p className="text-muted-foreground mb-6">Start applying to tasks to see your applications here</p>
            <Button asChild>
              <Link href="/dashboard/browse-tasks">Browse Tasks</Link>
            </Button>
          </>
        ) : (
          <div className="w-full space-y-4">
            {/* Render recent applications here if available */}
            {/* Example:
            {recentApplications.map((app) => (
              <div key={app.id} className="border p-3 rounded-md">
                <p>{app.taskTitle}</p>
                <p className="text-sm text-muted-foreground">{app.status}</p>
              </div>
            ))}
            */}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
