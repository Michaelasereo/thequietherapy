"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Building2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useActionState } from "react"
import { partnerMagicLinkAction } from "@/actions/partner-auth"

export default function PartnerAuthPage() {
  const { toast } = useToast()
  const [isNewPartner, setIsNewPartner] = useState<boolean | null>(null)
  const [email, setEmail] = useState("")
  const [state, formAction, isPending] = useActionState(partnerMagicLinkAction, null)

  const handleExistingLogin = () => {
    if (!email.trim()) {
      toast({
        title: "Missing email",
        description: "Please enter your email address.",
        variant: "destructive",
      })
      return
    }

    const fd = new FormData()
    fd.append("email", email)
    formAction(fd)
  }

  // Handle form state
  if (state?.error) {
    toast({
      title: "Login Failed",
      description: state.error,
      variant: "destructive",
    })
  }

  if (state?.success) {
    toast({
      title: "Magic Link Sent!",
      description: state.success,
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Partner Portal</h1>
          </div>
          <p className="text-muted-foreground">Access your organization's therapy management dashboard</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isNewPartner === null ? (
            // Choose new or existing
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">Welcome to Trpi Partner Portal</h2>
                <p className="text-muted-foreground">Are you a new or existing partner?</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2"
                  onClick={() => setIsNewPartner(true)}
                >
                  <Building2 className="h-6 w-6" />
                  <span className="font-medium">New Partner</span>
                  <span className="text-sm text-muted-foreground">Join our network</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2"
                  onClick={() => setIsNewPartner(false)}
                >
                  <ArrowRight className="h-6 w-6" />
                  <span className="font-medium">Existing Partner</span>
                  <span className="text-sm text-muted-foreground">Sign in to dashboard</span>
                </Button>
              </div>
            </div>
          ) : isNewPartner ? (
            // New partner - redirect to onboarding
            <div className="text-center space-y-4">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Welcome New Partner!</h2>
                <p className="text-muted-foreground">Let's get your organization set up with Trpi</p>
              </div>
              
              <Button asChild className="w-full">
                <Link href="/partner/onboarding">
                  Start Onboarding Process
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => setIsNewPartner(null)}
                className="w-full"
              >
                Back to Selection
              </Button>
            </div>
          ) : (
            // Existing partner login
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">Partner Login</h2>
                <p className="text-muted-foreground">Enter your email to receive a secure login link</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Business Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@yourcompany.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <Button onClick={handleExistingLogin} className="w-full" disabled={isPending}>
                  {isPending ? "Sending..." : "Send Magic Link"}
                </Button>
                
                <div className="text-center text-sm text-muted-foreground">
                  <p>We'll send you a secure link to access your dashboard.</p>
                </div>
                
                <div className="text-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsNewPartner(null)}
                    className="text-sm"
                  >
                    Back to Selection
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
