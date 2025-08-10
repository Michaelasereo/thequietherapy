import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import TaskCard from "./task-card"
import { smartMatches } from "@/lib/data"

export default function SmartMatchesSection() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold">Smart Matches for You</CardTitle>
          <p className="text-sm text-muted-foreground">Personalized task recommendations based on your skills</p>
        </div>
        <Button variant="outline" className="bg-transparent">
          <Eye className="h-4 w-4 mr-2" /> 7 matches
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {smartMatches.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </CardContent>
    </Card>
  )
}
