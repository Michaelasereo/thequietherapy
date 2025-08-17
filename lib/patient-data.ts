import { supabase } from '@/lib/supabase'

// Types for patient data
export interface PatientBiodata {
  id?: string
  user_id?: string
  name?: string
  age?: number
  sex?: 'male' | 'female' | 'other'
  religion?: string
  occupation?: string
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed' | 'separated'
  tribe?: string
  level_of_education?: 'primary' | 'secondary' | 'diploma' | 'bachelor' | 'master' | 'phd' | 'other'
  complaints?: string
  therapist_preference?: string
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
  try {
    const { data, error } = await supabase
      .from('patient_biodata')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching patient biodata:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching patient biodata:', error)
    return null
  }
}

export async function upsertPatientBiodata(userId: string, biodata: Partial<PatientBiodata>): Promise<PatientBiodata | null> {
  try {
    const { data, error } = await supabase
      .from('patient_biodata')
      .upsert({
        user_id: userId,
        ...biodata
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting patient biodata:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error upserting patient biodata:', error)
    return null
  }
}

// Patient Family History Functions
export async function getPatientFamilyHistory(userId: string): Promise<PatientFamilyHistory | null> {
  try {
    const { data, error } = await supabase
      .from('patient_family_history')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching patient family history:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching patient family history:', error)
    return null
  }
}

export async function upsertPatientFamilyHistory(userId: string, familyHistory: Partial<PatientFamilyHistory>): Promise<PatientFamilyHistory | null> {
  try {
    const { data, error } = await supabase
      .from('patient_family_history')
      .upsert({
        user_id: userId,
        ...familyHistory
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting patient family history:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error upserting patient family history:', error)
    return null
  }
}

// Patient Social History Functions
export async function getPatientSocialHistory(userId: string): Promise<PatientSocialHistory | null> {
  try {
    const { data, error } = await supabase
      .from('patient_social_history')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching patient social history:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching patient social history:', error)
    return null
  }
}

export async function upsertPatientSocialHistory(userId: string, socialHistory: Partial<PatientSocialHistory>): Promise<PatientSocialHistory | null> {
  try {
    const { data, error } = await supabase
      .from('patient_social_history')
      .upsert({
        user_id: userId,
        ...socialHistory
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting patient social history:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error upserting patient social history:', error)
    return null
  }
}

// Patient Medical History Functions (Therapist only)
export async function getPatientMedicalHistory(userId: string): Promise<PatientMedicalHistory[]> {
  try {
    const { data, error } = await supabase
      .from('patient_medical_history')
      .select('*')
      .eq('user_id', userId)
      .order('diagnosis_date', { ascending: false })

    if (error) {
      console.error('Error fetching patient medical history:', error)
      return []
    }

    return data || []
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

// Patient Drug History Functions (Therapist only)
export async function getPatientDrugHistory(userId: string): Promise<PatientDrugHistory[]> {
  try {
    const { data, error } = await supabase
      .from('patient_drug_history')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })

    if (error) {
      console.error('Error fetching patient drug history:', error)
      return []
    }

    return data || []
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
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  } catch (error) {
    console.error('Error getting current user ID:', error)
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
