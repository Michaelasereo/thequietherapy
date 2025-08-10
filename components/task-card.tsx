import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, MapPin, CalendarDays, Users, Eye, ArrowRight } from "lucide-react"
import Image from "next/image"

interface TaskCardProps {
  task: {
    id: string
    title: string
    salary: string
    type: string
    location: string
    date: string
    matchScore: string
    description: string
    tags: string[]
    company: string
    verified: boolean
    applicants: number
  }
}

export default function TaskCard({ task }: TaskCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <CardTitle className="text-xl font-bold">{task.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span className="font-semibold">{task.salary}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {task.type}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {task.location}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" /> {task.date}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-primary font-semibold text-lg">
              {task.verified && <CheckCircle className="h-4 w-4" />}
              {task.id.substring(0, 7).toUpperCase()}
            </div>
            <div className="text-primary font-bold text-2xl mt-1">{task.matchScore}</div>
            <div className="text-xs text-muted-foreground">Match Score</div>
          </div>
        </div>
        <CardDescription className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {task.description}
        </CardDescription>
        <div className="flex flex-wrap gap-2 mb-4">
          {task.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="bg-muted text-muted-foreground">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Image
              src="/placeholder.svg?height=24&width=24"
              alt="Company Logo"
              width={24}
              height={24}
              className="rounded-full"
            />
            <span>{task.company}</span>
            {task.verified && (
              <Badge variant="outline" className="text-primary border-primary">
                Verified
              </Badge>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" /> {task.applicants}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-transparent">
              <Eye className="h-4 w-4 mr-2" /> View Details
            </Button>
            <Button>
              Apply Now <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
