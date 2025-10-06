'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
}

export function OnboardingModal({ isOpen, onClose, user }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [canSkip, setCanSkip] = useState(false)
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Allow skipping after 10 seconds (not immediately)
  useEffect(() => {
    const timer = setTimeout(() => setCanSkip(true), 10000)
    return () => clearTimeout(timer)
  }, [])

  // Therapy goals options
  const therapyGoals = [
    "Manage stress and anxiety",
    "Improve relationships",
    "Personal growth and self-awareness",
    "Cope with life changes"
  ]

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    )
  }

  // Get user type specific steps
  const getUserTypeSteps = () => {
    const userType = user?.user_type || 'individual'
    
    const stepsByType = {
      individual: [
        { title: 'Welcome to Quiet! 👋', description: "Let's set up your therapy profile in just a few steps" },
        { title: 'Complete Your Profile 📝', description: 'Add your basic information to personalize your experience' },
        { title: 'Set Your Goals 🎯', description: 'Tell us what brings you here and what you hope to achieve' },
        { title: 'Find Your Therapist 🔍', description: 'Set preferences to match with the right therapist' },
        { title: "You're All Set! 🎉", description: 'Your profile is ready. Start your wellness journey today!' }
      ],
      therapist: [
        { title: 'Welcome to Quiet! 👋', description: "Complete your therapist profile to start helping clients" },
        { title: 'Professional Details 🎓', description: 'Add your credentials and qualifications' },
        { title: 'Specializations 💡', description: 'Define your areas of expertise' },
        { title: 'Set Availability 📅', description: 'Configure your session schedule' },
        { title: "You're Ready! 🎉", description: 'Your profile is complete. Start accepting clients!' }
      ],
      partner: [
        { title: 'Welcome to Quiet! 👋', description: "Let's set up your organization profile" },
        { title: 'Institution Details 🏢', description: 'Add your organization information' },
        { title: 'Define Services 📋', description: 'Configure your service offerings' },
        { title: 'Manage Team 👥', description: 'Add team members and staff' },
        { title: "You're Set! 🎉", description: 'Your organization is ready to provide services!' }
      ]
    }
    
    return stepsByType[userType as keyof typeof stepsByType] || stepsByType.individual
  }

  const steps = getUserTypeSteps()
  const totalSteps = steps.length

  const handleComplete = async () => {
    if (isCompleting) return // Prevent double clicks
    
    console.log('🎯 Complete Setup button clicked')
    setIsCompleting(true)
    
    try {
      // Save preferences first if user is individual and has selected goals
      if (user?.user_type === 'individual' && selectedGoals.length > 0) {
        console.log('💾 Saving therapy goals:', selectedGoals)
        const prefsResponse = await fetch('/api/user/save-preferences', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            therapyGoals: selectedGoals 
          })
        })
        
        if (!prefsResponse.ok) {
          console.error('❌ Failed to save preferences')
        } else {
          console.log('✅ Preferences saved')
        }
      }

      // Mark onboarding as complete
      console.log('📝 Marking onboarding as complete')
      const response = await fetch('/api/user/complete-onboarding', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      
      if (response.ok) {
        console.log('✅ Onboarding completed successfully')
        toast({
          title: "Welcome to Quiet! 🎉",
          description: "Your profile setup is complete. Let's get started!",
        })
        onClose()
        router.refresh()
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Onboarding completion failed:', errorData)
        toast({
          title: "Error",
          description: errorData.error || "Failed to complete setup. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('❌ Error completing onboarding:', error)
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsCompleting(false)
    }
  }

  const handleSkip = () => {
    // Mark as skipped in localStorage
    localStorage.setItem('onboarding-skipped', 'true')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <CardTitle className="text-center text-xl">
            {steps[currentStep - 1].title}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Step content */}
          <p className="text-center text-muted-foreground mb-6">
            {steps[currentStep - 1].description}
          </p>

          {/* Step-specific content */}
          {currentStep === 2 && user?.user_type === 'individual' && (
            <div className="space-y-3 text-sm mb-4 bg-muted/50 p-4 rounded-lg">
              <p className="font-medium">You can complete your profile anytime by visiting:</p>
              <p className="text-muted-foreground">Dashboard → Biodata</p>
              <p className="text-muted-foreground mt-2">This includes adding personal information, emergency contacts, and more.</p>
            </div>
          )}

          {currentStep === 3 && user?.user_type === 'individual' && (
            <div className="space-y-4 mb-4">
              <p className="text-sm font-medium">Select your therapy goals (you can choose multiple):</p>
              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
                {therapyGoals.map((goal) => (
                  <div key={goal} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                    <Checkbox
                      id={goal}
                      checked={selectedGoals.includes(goal)}
                      onCheckedChange={() => toggleGoal(goal)}
                    />
                    <Label
                      htmlFor={goal}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {goal}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedGoals.length > 0 
                  ? `${selectedGoals.length} goal${selectedGoals.length > 1 ? 's' : ''} selected`
                  : "Select at least one goal to continue"}
              </p>
            </div>
          )}

          {currentStep === 4 && user?.user_type === 'individual' && (
            <div className="space-y-3 text-sm mb-4 bg-muted/50 p-4 rounded-lg">
              <p className="font-medium text-center">You can browse and book therapists anytime from:</p>
              <p className="text-muted-foreground text-center">Dashboard → Therapy</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            {currentStep > 1 ? (
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                ← Back
              </Button>
            ) : (
              <div /> // Spacer
            )}

            <div className="flex gap-2">
              {canSkip && currentStep === 1 && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                >
                  Skip for now
                </Button>
              )}
              
              {currentStep < totalSteps ? (
                <Button 
                  onClick={() => {
                    // On step 3, validate at least one goal is selected for individuals
                    if (currentStep === 3 && user?.user_type === 'individual' && selectedGoals.length === 0) {
                      toast({
                        title: "Please select at least one goal",
                        description: "This helps us match you with the right therapist.",
                        variant: "destructive"
                      })
                      return
                    }
                    setCurrentStep(currentStep + 1)
                  }}
                  disabled={currentStep === 3 && user?.user_type === 'individual' && selectedGoals.length === 0}
                >
                  Continue →
                </Button>
              ) : (
                <Button 
                  onClick={handleComplete} 
                  disabled={isCompleting}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {isCompleting ? "Completing..." : "Complete Setup ✓"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

