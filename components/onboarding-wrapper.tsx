'use client'

import { useState, useEffect } from 'react'
import { OnboardingModal } from './onboarding-modal'

interface OnboardingWrapperProps {
  user: any
}

export function OnboardingWrapper({ user }: OnboardingWrapperProps) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        // Check if user has completed onboarding
        const response = await fetch('/api/user/onboarding-status', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          const completed = data.hasCompletedOnboarding || false
          setHasCompletedOnboarding(completed)
          setIsModalOpen(!completed)
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkOnboarding()
  }, [user])

  const handleClose = () => {
    setIsModalOpen(false)
    setHasCompletedOnboarding(true)
  }

  if (isLoading || hasCompletedOnboarding) {
    return null
  }

  return (
    <OnboardingModal 
      isOpen={isModalOpen} 
      onClose={handleClose} 
      user={user} 
    />
  )
}

