// User credit packages for the platform
export interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  currency: string
  description: string
  popular?: boolean
  discount?: number
}

export const userCreditPackages: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Package',
    credits: 1,
    price: 50,
    currency: 'NGN',
    description: 'Perfect for trying out our therapy services'
  },
  {
    id: 'basic',
    name: 'Basic Package',
    credits: 3,
    price: 120,
    currency: 'NGN',
    description: 'Great for regular therapy sessions',
    discount: 20
  },
  {
    id: 'standard',
    name: 'Standard Package',
    credits: 5,
    price: 180,
    currency: 'NGN',
    description: 'Most popular choice for consistent therapy',
    popular: true,
    discount: 28
  },
  {
    id: 'premium',
    name: 'Premium Package',
    credits: 10,
    price: 320,
    currency: 'NGN',
    description: 'Best value for long-term therapy support',
    discount: 36
  }
]

// Therapist data (empty array since therapists are fetched from API)
export const therapists: any[] = []

// Mock data for development
export const mockTherapists = [
  {
    id: 'therapist-1',
    name: 'Dr. Sarah Johnson',
    specialization: 'Anxiety & Depression',
    rating: 4.9,
    experience: '8 years',
    avatar: '/avatars/sarah.jpg',
    available: true,
    nextAvailable: 'Today, 2:00 PM'
  },
  {
    id: 'therapist-2',
    name: 'Dr. Michael Chen',
    specialization: 'Relationship Therapy',
    rating: 4.8,
    experience: '12 years',
    avatar: '/avatars/michael.jpg',
    available: true,
    nextAvailable: 'Today, 4:30 PM'
  }
]
