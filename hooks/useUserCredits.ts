"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface CreditsData {
  credits: number
  package_type: string
}

export function useUserCredits() {
  const [credits, setCredits] = useState<CreditsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get user credits
  const getCredits = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('credits, package_type')
        .eq('id', user.id)
        .single()

      if (error) {
        setError(error.message)
      } else {
        setCredits(data)
      }
    } catch (err) {
      setError('Failed to fetch credits')
    } finally {
      setLoading(false)
    }
  }

  // Add credits
  const addCredits = async (amount: number) => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('User not authenticated')
        return
      }

      const { data, error } = await supabase
        .from('users')
        .update({ 
          credits: supabase.rpc('increment_credits', { amount }) 
        })
        .eq('id', user.id)
        .select('credits, package_type')
        .single()

      if (error) {
        setError(error.message)
      } else {
        setCredits(data)
      }
    } catch (err) {
      setError('Failed to add credits')
    } finally {
      setLoading(false)
    }
  }

  // Deduct credits
  const deductCredits = async (amount: number) => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('User not authenticated')
        return
      }

      const { data, error } = await supabase
        .from('users')
        .update({ 
          credits: supabase.rpc('decrement_credits', { amount }) 
        })
        .eq('id', user.id)
        .select('credits, package_type')
        .single()

      if (error) {
        setError(error.message)
      } else {
        setCredits(data)
      }
    } catch (err) {
      setError('Failed to deduct credits')
    } finally {
      setLoading(false)
    }
  }

  // Check if user has enough credits
  const hasEnoughCredits = (requiredAmount: number) => {
    return credits ? credits.credits >= requiredAmount : false
  }

  // Load credits on mount
  useEffect(() => {
    getCredits()
  }, [])

  return {
    credits,
    loading,
    error,
    getCredits,
    addCredits,
    deductCredits,
    hasEnoughCredits
  }
}
