import { useState, useEffect, useCallback } from 'react'
import { 
  PatientBiodata, 
  PatientFamilyHistory, 
  PatientSocialHistory, 
  PatientMedicalHistory, 
  PatientDrugHistory,
  CompletePatientProfile,
  getPatientBiodata,
  upsertPatientBiodata,
  getPatientFamilyHistory,
  upsertPatientFamilyHistory,
  getPatientSocialHistory,
  upsertPatientSocialHistory,
  getPatientMedicalHistory,
  getPatientDrugHistory,
  getCompletePatientProfile,
  getCurrentUserId
} from '@/lib/patient-data'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'

interface UsePatientDataReturn {
  // State
  biodata: PatientBiodata | null
  familyHistory: PatientFamilyHistory | null
  socialHistory: PatientSocialHistory | null
  medicalHistory: PatientMedicalHistory[]
  drugHistory: PatientDrugHistory[]
  completeProfile: CompletePatientProfile | null
  
  // Loading states
  loading: {
    biodata: boolean
    familyHistory: boolean
    socialHistory: boolean
    medicalHistory: boolean
    drugHistory: boolean
    completeProfile: boolean
  }
  
  // Error states
  errors: {
    biodata: string | null
    familyHistory: string | null
    socialHistory: string | null
    medicalHistory: string | null
    drugHistory: string | null
    completeProfile: string | null
  }
  
  // Actions
  refreshBiodata: () => Promise<void>
  updateBiodata: (data: Partial<PatientBiodata>) => Promise<boolean>
  refreshFamilyHistory: () => Promise<void>
  updateFamilyHistory: (data: Partial<PatientFamilyHistory>) => Promise<boolean>
  refreshSocialHistory: () => Promise<void>
  updateSocialHistory: (data: Partial<PatientSocialHistory>) => Promise<boolean>
  refreshMedicalHistory: () => Promise<void>
  refreshDrugHistory: () => Promise<void>
  refreshCompleteProfile: () => Promise<void>
  
  // Real-time data
  realTimeUpdates: number
  isOnline: boolean
  
  // Utility
  userId: string | null
  isLoading: boolean
  hasErrors: boolean
}

export function usePatientData(): UsePatientDataReturn {
  const [userId, setUserId] = useState<string | null>(null)
  
  // State for individual data types
  const [biodata, setBiodata] = useState<PatientBiodata | null>(null)
  const [familyHistory, setFamilyHistory] = useState<PatientFamilyHistory | null>(null)
  const [socialHistory, setSocialHistory] = useState<PatientSocialHistory | null>(null)
  const [medicalHistory, setMedicalHistory] = useState<PatientMedicalHistory[]>([])
  const [drugHistory, setDrugHistory] = useState<PatientDrugHistory[]>([])
  const [completeProfile, setCompleteProfile] = useState<CompletePatientProfile | null>(null)
  
  // Real-time data state
  const [realTimeUpdates, setRealTimeUpdates] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  
  // Loading states
  const [loading, setLoading] = useState({
    biodata: false,
    familyHistory: false,
    socialHistory: false,
    medicalHistory: false,
    drugHistory: false,
    completeProfile: false
  })
  
  // Error states
  const [errors, setErrors] = useState({
    biodata: null as string | null,
    familyHistory: null as string | null,
    socialHistory: null as string | null,
    medicalHistory: null as string | null,
    drugHistory: null as string | null,
    completeProfile: null as string | null
  })
  
  // Get current user ID on mount
  useEffect(() => {
    const fetchUserId = async () => {
      const id = await getCurrentUserId()
      setUserId(id)
    }
    fetchUserId()
  }, [])

  // Refresh functions - defined before useEffect that uses them
  const refreshBiodata = useCallback(async () => {
    if (!userId) return
    
    setLoading(prev => ({ ...prev, biodata: true }))
    setErrors(prev => ({ ...prev, biodata: null }))
    
    try {
      const data = await getPatientBiodata(userId)
      setBiodata(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch biodata'
      setErrors(prev => ({ ...prev, biodata: errorMessage }))
      console.error('Error fetching biodata:', error)
    } finally {
      setLoading(prev => ({ ...prev, biodata: false }))
    }
  }, [userId])

  const refreshFamilyHistory = useCallback(async () => {
    if (!userId) return
    
    setLoading(prev => ({ ...prev, familyHistory: true }))
    setErrors(prev => ({ ...prev, familyHistory: null }))
    
    try {
      const data = await getPatientFamilyHistory(userId)
      setFamilyHistory(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch family history'
      setErrors(prev => ({ ...prev, familyHistory: errorMessage }))
      console.error('Error fetching family history:', error)
    } finally {
      setLoading(prev => ({ ...prev, familyHistory: false }))
    }
  }, [userId])

  const refreshSocialHistory = useCallback(async () => {
    if (!userId) return
    
    setLoading(prev => ({ ...prev, socialHistory: true }))
    setErrors(prev => ({ ...prev, socialHistory: null }))
    
    try {
      const data = await getPatientSocialHistory(userId)
      setSocialHistory(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch social history'
      setErrors(prev => ({ ...prev, socialHistory: errorMessage }))
      console.error('Error fetching social history:', error)
    } finally {
      setLoading(prev => ({ ...prev, socialHistory: false }))
    }
  }, [userId])

  const refreshMedicalHistory = useCallback(async () => {
    if (!userId) return
    
    setLoading(prev => ({ ...prev, medicalHistory: true }))
    setErrors(prev => ({ ...prev, medicalHistory: null }))
    
    try {
      const data = await getPatientMedicalHistory(userId)
      setMedicalHistory(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch medical history'
      setErrors(prev => ({ ...prev, medicalHistory: errorMessage }))
      console.error('Error fetching medical history:', error)
    } finally {
      setLoading(prev => ({ ...prev, medicalHistory: false }))
    }
  }, [userId])

  const refreshDrugHistory = useCallback(async () => {
    if (!userId) return
    
    setLoading(prev => ({ ...prev, drugHistory: true }))
    setErrors(prev => ({ ...prev, drugHistory: null }))
    
    try {
      const data = await getPatientDrugHistory(userId)
      setDrugHistory(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch drug history'
      setErrors(prev => ({ ...prev, drugHistory: errorMessage }))
      console.error('Error fetching drug history:', error)
    } finally {
      setLoading(prev => ({ ...prev, drugHistory: false }))
    }
  }, [userId])

  // Real-time subscriptions for medical data
  useEffect(() => {
    if (!userId) return

    console.log('🔍 Setting up real-time subscriptions for patient medical data:', userId)

    // Subscribe to biodata changes
    // Real-time subscriptions disabled - using polling instead
    // const biodataSubscription = supabase...

    // Real-time subscriptions disabled - using polling instead
    // const familyHistorySubscription = supabase...

    // Real-time subscriptions disabled - using polling instead
    // const socialHistorySubscription = supabase...

    // Real-time subscriptions disabled - using polling instead
    // const medicalHistorySubscription = supabase...

    // Real-time subscriptions disabled - using polling instead
    // const drugHistorySubscription = supabase...

    // Network status monitoring
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      console.log('🔍 Cleaning up patient medical data subscriptions')
      // Real-time subscriptions disabled - no cleanup needed
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [userId, refreshBiodata, refreshFamilyHistory, refreshSocialHistory, refreshMedicalHistory, refreshDrugHistory])
  
  // Update biodata
  const updateBiodata = useCallback(async (data: Partial<PatientBiodata>): Promise<boolean> => {
    console.log('🔄 updateBiodata called with userId:', userId, 'data:', data)
    
    if (!userId) {
      console.log('❌ No userId available')
      return false
    }
    
    setLoading(prev => ({ ...prev, biodata: true }))
    setErrors(prev => ({ ...prev, biodata: null }))
    
    try {
      console.log('📞 Calling upsertPatientBiodata...')
      const updatedData = await upsertPatientBiodata(userId, data)
      console.log('📞 upsertPatientBiodata result:', updatedData)
      
      if (updatedData) {
        setBiodata(updatedData)
        toast({
          title: "Success",
          description: "Personal information updated successfully.",
        })
        console.log('✅ Biodata updated successfully')
        return true
      } else {
        console.log('❌ upsertPatientBiodata returned null')
        throw new Error('Failed to update biodata')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update biodata'
      setErrors(prev => ({ ...prev, biodata: errorMessage }))
      toast({
        title: "Error",
        description: "Failed to update information. Please try again.",
        variant: "destructive",
      })
      console.error('❌ Error updating biodata:', error)
      return false
    } finally {
      setLoading(prev => ({ ...prev, biodata: false }))
    }
  }, [userId])
  
  
  // Update family history
  const updateFamilyHistory = useCallback(async (data: Partial<PatientFamilyHistory>): Promise<boolean> => {
    if (!userId) return false
    
    setLoading(prev => ({ ...prev, familyHistory: true }))
    setErrors(prev => ({ ...prev, familyHistory: null }))
    
    try {
      const updatedData = await upsertPatientFamilyHistory(userId, data)
      if (updatedData) {
        setFamilyHistory(updatedData)
        toast({
          title: "Success",
          description: "Family history updated successfully.",
        })
        return true
      } else {
        throw new Error('Failed to update family history')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update family history'
      setErrors(prev => ({ ...prev, familyHistory: errorMessage }))
      toast({
        title: "Error",
        description: "Failed to update family history. Please try again.",
        variant: "destructive",
      })
      console.error('Error updating family history:', error)
      return false
    } finally {
      setLoading(prev => ({ ...prev, familyHistory: false }))
    }
  }, [userId])
  
  
  // Update social history
  const updateSocialHistory = useCallback(async (data: Partial<PatientSocialHistory>): Promise<boolean> => {
    if (!userId) return false
    
    setLoading(prev => ({ ...prev, socialHistory: true }))
    setErrors(prev => ({ ...prev, socialHistory: null }))
    
    try {
      const updatedData = await upsertPatientSocialHistory(userId, data)
      if (updatedData) {
        setSocialHistory(updatedData)
        toast({
          title: "Success",
          description: "Social history updated successfully.",
        })
        return true
      } else {
        throw new Error('Failed to update social history')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update social history'
      setErrors(prev => ({ ...prev, socialHistory: errorMessage }))
      toast({
        title: "Error",
        description: "Failed to update social history. Please try again.",
        variant: "destructive",
      })
      console.error('Error updating social history:', error)
      return false
    } finally {
      setLoading(prev => ({ ...prev, socialHistory: false }))
    }
  }, [userId])
  
  
  
  // Refresh complete profile
  const refreshCompleteProfile = useCallback(async () => {
    if (!userId) return
    
    setLoading(prev => ({ ...prev, completeProfile: true }))
    setErrors(prev => ({ ...prev, completeProfile: null }))
    
    try {
      const data = await getCompletePatientProfile(userId)
      setCompleteProfile(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch complete profile'
      setErrors(prev => ({ ...prev, completeProfile: errorMessage }))
      console.error('Error fetching complete profile:', error)
    } finally {
      setLoading(prev => ({ ...prev, completeProfile: false }))
    }
  }, [userId])
  
  // Computed values
  const isLoading = Object.values(loading).some(Boolean)
  const hasErrors = Object.values(errors).some(error => error !== null)
  
  return {
    // State
    biodata,
    familyHistory,
    socialHistory,
    medicalHistory,
    drugHistory,
    completeProfile,
    
    // Loading states
    loading,
    
    // Error states
    errors,
    
    // Actions
    refreshBiodata,
    updateBiodata,
    refreshFamilyHistory,
    updateFamilyHistory,
    refreshSocialHistory,
    updateSocialHistory,
    refreshMedicalHistory,
    refreshDrugHistory,
    refreshCompleteProfile,
    
    // Real-time data
    realTimeUpdates,
    isOnline,
    
    // Utility
    userId,
    isLoading,
    hasErrors
  }
}
