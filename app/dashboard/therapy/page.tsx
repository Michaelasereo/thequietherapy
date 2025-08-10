import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Video } from "lucide-react"

export default function GoToTherapyPage() {
  const sessionLink = "https://meet.google.com/abc-defg-hij" // Example link

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Go to Therapy</h2>

      <Card className="text-center p-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Your Next Session Awaits!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg text-muted-foreground">
            Click the button below to join your scheduled therapy session.
          </p>
          <Button asChild size="lg" className="px-8 py-6 text-lg">
            <Link href={sessionLink} target="_blank" rel="noopener noreferrer">
              <Video className="mr-3 h-6 w-6" />
              Join Session Now
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Please ensure you have a stable internet connection and a quiet environment.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm space-y-2">
          <p>- Your session link is unique to your appointment. Do not share it.</p>
          <p>- If you experience technical difficulties, please contact support immediately.</p>
          <p>- Sessions typically start on time. Please be ready a few minutes beforehand.</p>
        </CardContent>
      </Card>
    </div>
  )
}
