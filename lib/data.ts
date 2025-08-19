import {
  Brain,
  Heart,
  MessageSquare,
  ShieldCheck,
  Users,
  Home,
  Calendar,
  Video,
  Settings,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  UserCheck,
  BookOpen,
  Leaf,
  Stethoscope,
  Eye,
  List,
  Bell,
} from "lucide-react"

export const navLinks = [
  { name: "Therapy", href: "#therapy" },
  { name: "About Us", href: "#about" },
  { name: "FAQs", href: "/faqs" },
  { name: "Articles", href: "/articles" },
]

export const coreServices = [
  {
    icon: Leaf,
    title: "Patient-Focused Care",
    description: "Quietly take notes in the background with Mpilo, allowing you to stay fully engaged in the conversation.",
  },
  {
    icon: CheckCircle2,
    title: "Keep everything compliant",
    description: "Our HIPAA-compliant security protects patient information while generating notes that meet industry standards.",
  },
  {
    icon: Clock,
    title: "Save loads of time",
    description: "Spend up to 70% less time on paperwork. Get home on time with your work done.",
  },
  {
    icon: List,
    title: "Reduce mistakes, improve care",
    description: "Get accurate, detailed notes every time. Spot patterns and make better decisions with reliable records.",
  },
  {
    icon: Stethoscope,
    title: "Works for all kinds of doctors",
    description: "Whether you're fixing bones, treating kids, or doing check-ups, Mpilo learns how you like your notes.",
  },
  {
    icon: Eye,
    title: "Review notes in a snap",
    description: "Check and approve your notes quickly. More time for patients, less for paperwork.",
  },
]

export const whyUsBenefits = [
  "Expert-vetted therapists",
  "Personalized matching",
  "Secure and confidential platform",
  "Flexible scheduling options",
  "Affordable and transparent pricing",
  "Diverse range of specializations",
]

export const whyUsFeatures = [
  {
    id: "secure",
    name: "Secure",
    icon: "🔒",
    description: "End-to-end encrypted video calls and HIPAA-compliant data protection",
    details: {
      amount: "256-bit",
      period: "Encryption",
      status: "HIPAA Compliant",
      statusColor: "bg-green-100 text-green-800"
    }
  },
  {
    id: "video",
    name: "In-App Video",
    icon: "📹",
    description: "High-quality, low-latency video calls built directly into the platform",
    details: {
      amount: "HD Quality",
      period: "Real-time",
      status: "Live",
      statusColor: "bg-blue-100 text-blue-800"
    }
  },
  {
    id: "payment",
    name: "Payment Model",
    icon: "💳",
    description: "Flexible credit-based system with transparent pricing and no hidden fees",
    details: {
      amount: "Credits",
      period: "Pay-as-you-go",
      status: "Transparent",
      statusColor: "bg-purple-100 text-purple-800"
    }
  },
  {
    id: "different",
    name: "Why We're Different",
    icon: "⭐",
    description: "Personalized matching, expert therapists, and comprehensive mental health support",
    details: {
      amount: "100%",
      period: "Personalized",
      status: "Expert Vetted",
      statusColor: "bg-orange-100 text-orange-800"
    }
  }
]

export const testimonials = [
  {
    quote:
      "Trpi has been a game-changer for my mental well-being. The platform is easy to use, and my therapist is incredibly supportive.",
    location: "Lagos, Nigeria",
    title: "Marketing Specialist",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    quote:
      "I appreciate the flexibility Trpi offers. I can book sessions around my busy schedule, and the quality of therapy is exceptional.",
    location: "Nairobi, Kenya",
    title: "Software Engineer",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    quote:
      "Finding the right therapist felt daunting, but Trpi made it simple. Highly recommend their personalized approach.",
    location: "Accra, Ghana",
    title: "Student",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

export const faqs = [
  {
    question: "What is Trpi?",
    answer:
      "Trpi is an online platform that connects individuals with licensed therapists for mental health support and counseling.",
  },
  {
    question: "How do I book a session?",
    answer:
      "You can book a session by clicking the 'Book' button on our homepage and following the three-step process: provide biodata, select a therapist, and complete checkout.",
  },
  {
    question: "Are the sessions confidential?",
    answer:
      "Yes, all sessions on Trpi are strictly confidential and conducted through a secure, encrypted platform to ensure your privacy.",
  },
  {
    question: "What types of therapy do you offer?",
    answer:
      "We offer a wide range of therapy types, including CBT, DBT, psychodynamic therapy, and more, catering to various mental health concerns.",
  },
  {
    question: "Can I choose my therapist?",
    answer:
      "Our platform allows you to browse therapist profiles, filter by specialization, gender, and age, and select the therapist that best fits your needs.",
  },
]

export const therapists: any[] = []

// New structure for dashboard sidebar navigation
export const dashboardSidebarGroups = [
  {
    label: "Navigation",
    items: [{ name: "Dashboard", href: "/dashboard", icon: Home }],
  },
  {
    label: "Therapy Sessions",
    items: [
      { name: "Book a Session", href: "/dashboard/book", icon: Calendar },
      { name: "Sessions", href: "/dashboard/sessions", icon: Calendar },
      { name: "Go to Therapy", href: "/dashboard/therapy", icon: Video },
    ],
  },
  {
    label: "Medical History",
    items: [
      { name: "Patient Biodata", href: "/dashboard/biodata", icon: Users },
      { name: "Family History", href: "/dashboard/family-history", icon: Users },
      { name: "Social History", href: "/dashboard/social-history", icon: BookOpen }, // New item
      { name: "Drug History & Previous Diagnosis", href: "/dashboard/medical-history", icon: Heart },
    ],
  },
  {
    label: "Communication",
    items: [
      { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    ],
  },
]

export const dashboardBottomNavItems = [{ name: "Settings", href: "/dashboard/settings", icon: Settings }]

// Dashboard summary cards - will be populated with real data
export const dashboardSummaryCards = [
  {
    title: "Total Sessions",
    value: "0",
    description: "Start your therapy journey",
    icon: CheckCircle2,
  },
  {
    title: "Upcoming Sessions",
    value: "0",
    description: "Book your first session",
    icon: Calendar,
  },
  {
    title: "Progress Score",
    value: "0%",
    description: "Track your progress",
    icon: TrendingUp,
  },
  {
    title: "Average Session Time",
    value: "0 min",
    description: "Typical duration",
    icon: Clock,
  },
]

// New mock data for session notes summary cards
export const sessionNotesSummaryCards = [
  {
    title: "Total Notes",
    value: "3", // Example value, will be dynamically calculated in component
    description: "All time session notes",
    icon: FileText,
  },
  {
    title: "Notes This Year",
    value: "3", // Example value, will be dynamically calculated in component
    description: "Notes recorded in 2025",
    icon: Calendar,
  },
  {
    title: "Therapists Seen",
    value: "1", // Example value, will be dynamically calculated in component
    description: "Unique therapists you've had notes with",
    icon: UserCheck,
  },
]

// Real data - Will be populated from database
export const upcomingSessions = []



// Real data - Will be populated from database
export const medicalHistory = []
export const medications = []

// Centralized patient profile data
export const patientProfileData = {
  name: "John Doe", // Placeholder, will be overridden by user context if available
  age: "32",
  sex: "Male",
  religion: "Christianity",
  occupation: "Software Engineer",
  maritalStatus: "Single",
  tribe: "Yoruba",
  levelOfEducation: "Master's Degree",
  complaints: "Anxiety, stress, difficulty sleeping.",
  therapistPreference: "CBT specialist, female therapist.",
  familyHistory: {
    mentalHealth: "Mother had depression, paternal uncle with anxiety.",
    substanceAbuse: "No known family history of substance abuse.",
    otherMedical: "Family history of hypertension on maternal side.",
  },
  socialHistory: {
    livingSituation: "Lives alone in an apartment.",
    employment: "Full-time software engineer, works remotely.",
    relationships: "Close relationship with sister, few close friends.",
    hobbiesInterests: "Enjoys reading, hiking, and playing video games.",
    substanceUse: {
      // Updated to an object for specific substances
      smoking: "No history of smoking.",
      alcohol: "Occasional social drinking (1-2 drinks per week).",
      otherDrugs: "No illicit drug use.",
    },
    stressors: "Work-related stress, recent breakup.",
  },
}

// User package types
export type UserPackage = "Basic" | "Standard" | "Pro" | "Partner"

// Credit packages for individual users
export const userCreditPackages = [
  { id: "basic", name: "Basic", credits: 10, price: 50000, description: "10 credits for individual sessions" },
  { id: "standard", name: "Standard", credits: 20, price: 90000, description: "20 credits for individual sessions" },
  { id: "pro", name: "Pro", credits: -1, price: 200000, description: "Unlimited credits for individual sessions" },
]

// Partner packages for bulk uploads
export const partnerPackages = [
  { id: "basic", name: "Basic", credits: 10, price: 50000 },
  { id: "standard", name: "Standard", credits: 20, price: 90000 },
  { id: "pro", name: "Pro", credits: -1, price: 200000 },
]

// Real user data - Will be populated from database
export const mockUser = {
  name: "",
  email: "",
  package: "Basic" as UserPackage,
  credits: 0,
  isPartnerUser: false,
  partnerName: "",
}

// Recent applications data
export const recentApplications = [
  // This array is empty by default as shown in the component
  // Applications will be populated when users actually apply to tasks
]

// Real data - Will be populated from database
export const smartMatches: Array<{
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
}> = []

// Real data - Will be populated from database
export const sessionNotes = []
