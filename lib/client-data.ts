import { supabase } from '@/lib/supabase'

// Types for patient data
export interface PatientBiodata {
  id?: string
  user_id?: string
  firstName?: string
  email?: string
  phone?: string
  country?: string
  age?: number
  sex?: 'male' | 'female' | 'other'
  religion?: string
  occupation?: string
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed' | 'separated'
  level_of_education?: 'primary' | 'secondary' | 'diploma' | 'bachelor' | 'master' | 'phd' | 'other'
  complaints?: string
  therapist_preference?: string
  therapist_gender_preference?: string
  therapist_specialization_preference?: string
  approved_at?: string
  created_at?: string
  updated_at?: string
}

export interface PatientFamilyHistory {
  id?: string
  user_id?: string
  mental_health_history?: string
  substance_abuse_history?: string
  other_medical_history?: string
  created_at?: string
  updated_at?: string
}

export interface PatientSocialHistory {
  id?: string
  user_id?: string
  living_situation?: string
  employment?: string
  relationships?: string
  hobbies_interests?: string
  smoking_history?: string
  alcohol_history?: string
  other_drugs_history?: string
  stressors?: string
  created_at?: string
  updated_at?: string
}

export interface PatientMedicalHistory {
  id?: string
  user_id?: string
  therapist_id?: string
  condition: string
  diagnosis_date: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface PatientDrugHistory {
  id?: string
  user_id?: string
  therapist_id?: string
  medication_name: string
  dosage: string
  start_date: string
  prescribing_doctor?: string
  notes?: string
  duration_of_usage?: string
  created_at?: string
  updated_at?: string
}

export interface CompletePatientProfile {
  biodata: PatientBiodata
  family_history: PatientFamilyHistory
  social_history: PatientSocialHistory
  medical_history: PatientMedicalHistory[]
  drug_history: PatientDrugHistory[]
}

// Patient Biodata Functions
export async function getPatientBiodata(userId: string): Promise<PatientBiodata | null> {
  console.log('🔄 getPatientBiodata called with userId:', userId)
  
  try {
    const response = await fetch('/api/patient/biodata', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })

    console.log('📞 getPatientBiodata response status:', response.status)

    if (response.ok) {
      const result = await response.json()
      console.log('📞 getPatientBiodata response data:', result)
      
      if (result.success) {
        console.log('✅ Biodata fetched successfully:', result.data)
        return result.data
      } else {
        console.log('❌ API returned error:', result.error)
      }
    } else {
      console.log('❌ getPatientBiodata request failed with status:', response.status)
    }

    return null
  } catch (error) {
    console.error('❌ Error fetching patient biodata:', error)
    return null
  }
}

export async function upsertPatientBiodata(userId: string, biodata: Partial<PatientBiodata>): Promise<PatientBiodata | null> {
  console.log('🔄 upsertPatientBiodata called with userId:', userId, 'biodata:', biodata)
  
  try {
    console.log('📤 Sending data to API:', biodata)
    
    const response = await fetch('/api/patient/biodata', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(biodata)
    })

    console.log('📞 API response status:', response.status)

    if (response.ok) {
      const result = await response.json()
      console.log('📞 API response data:', result)
      
      if (result.success) {
        console.log('✅ Upsert successful, returned data:', result.data)
        return result.data
      } else {
        console.error('❌ API returned error:', result.error)
        return null
      }
    } else {
      console.error('❌ API request failed with status:', response.status)
      return null
    }
  } catch (error) {
    console.error('❌ Exception in upsertPatientBiodata:', error)
    return null
  }
}

// Patient Family History Functions
export async function getPatientFamilyHistory(userId: string): Promise<PatientFamilyHistory | null> {
  try {
    const response = await fetch('/api/patient/family-history', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        return result.data
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching patient family history:', error)
    return null
  }
}

export async function upsertPatientFamilyHistory(userId: string, familyHistory: Partial<PatientFamilyHistory>): Promise<PatientFamilyHistory | null> {
  try {
    const response = await fetch('/api/patient/family-history', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(familyHistory)
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        return result.data
      }
    }

    return null
  } catch (error) {
    console.error('Error upserting patient family history:', error)
    return null
  }
}

// Patient Social History Functions
export async function getPatientSocialHistory(userId: string): Promise<PatientSocialHistory | null> {
  try {
    const response = await fetch('/api/patient/social-history', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        return result.data
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching patient social history:', error)
    return null
  }
}

export async function upsertPatientSocialHistory(userId: string, socialHistory: Partial<PatientSocialHistory>): Promise<PatientSocialHistory | null> {
  try {
    const response = await fetch('/api/patient/social-history', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(socialHistory)
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        return result.data
      }
    }

    return null
  } catch (error) {
    console.error('Error upserting patient social history:', error)
    return null
  }
}

// Patient Medical History Functions (Therapist only)
export async function getPatientMedicalHistory(userId: string): Promise<PatientMedicalHistory[]> {
  try {
    const response = await fetch(`/api/patient/medical-history?userId=${userId}`, {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })

    if (!response.ok) {
      console.error('Error fetching patient medical history:', response.status)
      return []
    }

    const data = await response.json()
    return data.success ? data.data || [] : []
  } catch (error) {
    console.error('Error fetching patient medical history:', error)
    return []
  }
}

export async function addPatientMedicalHistory(
  userId: string, 
  therapistId: string, 
  medicalHistory: Omit<PatientMedicalHistory, 'id' | 'user_id' | 'therapist_id' | 'created_at' | 'updated_at'>
): Promise<PatientMedicalHistory | null> {
  try {
    const { data, error } = await supabase
      .from('patient_medical_history')
      .insert({
        user_id: userId,
        therapist_id: therapistId,
        ...medicalHistory
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding patient medical history:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error adding patient medical history:', error)
    return null
  }
}

export async function updatePatientMedicalHistory(
  id: string,
  updates: Partial<Omit<PatientMedicalHistory, 'id' | 'user_id' | 'therapist_id' | 'created_at' | 'updated_at'>>
): Promise<PatientMedicalHistory | null> {
  try {
    const response = await fetch('/api/client/medical-history', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({ id, ...updates })
    })

    if (!response.ok) {
      console.error('Error updating patient medical history:', response.status)
      return null
    }

    const result = await response.json()
    return result.success ? result.data : null
  } catch (error) {
    console.error('Error updating patient medical history:', error)
    return null
  }
}

// Patient Drug History Functions (Therapist only)
export async function getPatientDrugHistory(userId: string): Promise<PatientDrugHistory[]> {
  try {
    const response = await fetch(`/api/patient/drug-history?userId=${userId}`, {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })

    if (!response.ok) {
      console.error('Error fetching patient drug history:', response.status)
      return []
    }

    const data = await response.json()
    return data.success ? data.data || [] : []
  } catch (error) {
    console.error('Error fetching patient drug history:', error)
    return []
  }
}

export async function addPatientDrugHistory(
  userId: string, 
  therapistId: string, 
  drugHistory: Omit<PatientDrugHistory, 'id' | 'user_id' | 'therapist_id' | 'created_at' | 'updated_at'>
): Promise<PatientDrugHistory | null> {
  try {
    const { data, error } = await supabase
      .from('patient_drug_history')
      .insert({
        user_id: userId,
        therapist_id: therapistId,
        ...drugHistory
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding patient drug history:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error adding patient drug history:', error)
    return null
  }
}

export async function updatePatientDrugHistory(
  id: string,
  updates: Partial<Omit<PatientDrugHistory, 'id' | 'user_id' | 'therapist_id' | 'created_at' | 'updated_at'>>
): Promise<PatientDrugHistory | null> {
  try {
    const response = await fetch('/api/client/drug-history', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({ id, ...updates })
    })

    if (!response.ok) {
      console.error('Error updating patient drug history:', response.status)
      return null
    }

    const result = await response.json()
    return result.success ? result.data : null
  } catch (error) {
    console.error('Error updating patient drug history:', error)
    return null
  }
}

// Complete Patient Profile Function
export async function getCompletePatientProfile(userId: string): Promise<CompletePatientProfile | null> {
  try {
    const [biodata, familyHistory, socialHistory, medicalHistory, drugHistory] = await Promise.all([
      getPatientBiodata(userId),
      getPatientFamilyHistory(userId),
      getPatientSocialHistory(userId),
      getPatientMedicalHistory(userId),
      getPatientDrugHistory(userId)
    ])

    return {
      biodata: biodata || {},
      family_history: familyHistory || {},
      social_history: socialHistory || {},
      medical_history: medicalHistory || [],
      drug_history: drugHistory || []
    }
  } catch (error) {
    console.error('Error fetching complete patient profile:', error)
    return null
  }
}

// Utility function to get current user ID
export async function getCurrentUserId(): Promise<string | null> {
  console.log('🔄 getCurrentUserId called')
  
  try {
    // Call the /api/auth/me endpoint to get current user info
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    
    console.log('📞 /api/auth/me response status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('📞 /api/auth/me response data:', data)
      
      if (data.success && data.user) {
        console.log('✅ User ID found:', data.user.id)
        return data.user.id
      } else {
        console.log('❌ No user data in response')
      }
    } else {
      console.log('❌ /api/auth/me request failed with status:', response.status)
    }
    
    return null
  } catch (error) {
    console.error('❌ Error getting current user ID:', error)
    return null
  }
}

// Utility function to check if user is a therapist
export async function isTherapist(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('global_users')
      .select('user_type')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error checking if user is therapist:', error)
      return false
    }

    return data?.user_type === 'therapist'
  } catch (error) {
    console.error('Error checking if user is therapist:', error)
    return false
  }
}

// Utility function to get patient biodata by user ID (for therapist use)
export async function getPatientBiodataById(userId: string): Promise<PatientBiodata | null> {
  try {
    const { data, error } = await supabase
      .from('patient_biodata')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching patient biodata by ID:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching patient biodata by ID:', error)
    return null
  }
}
