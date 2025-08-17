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
    value: "50 min",
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

export const upcomingSessions = [
  {
    id: "s1",
    date: "2025-09-15",
    time: "10:00 AM",
    therapist: "Dr. Emily White",
    topic: "Coping with Stress",
  },
  {
    id: "s2",
    date: "2025-09-18",
    time: "02:30 PM",
    therapist: "Mr. John Davis",
    topic: "Processing Past Trauma",
  },
]



export const medicalHistory = [
  {
    id: "mh1",
    condition: "Generalized Anxiety Disorder (GAD)",
    diagnosisDate: "2023-01-10",
    notes: "Diagnosed by primary care physician. Managed with therapy and lifestyle changes.",
  },
  {
    id: "mh2",
    condition: "Seasonal Allergies",
    diagnosisDate: "2010-03-01",
    notes: "Seasonal allergies to pollen. Managed with over-the-counter antihistamines.",
  },
]

export const medications = [
  {
    id: "med1",
    name: "Sertraline (Zoloft)",
    dosage: "50mg daily",
    startDate: "2023-02-15",
    prescribingDoctor: "Dr. Smith (PCP)",
    notes: "Prescribed for GAD. No significant side effects reported.",
    durationOfUsage: "2 years", // Added duration of usage
  },
  {
    id: "med2",
    name: "Ibuprofen",
    dosage: "200mg as needed",
    startDate: "22024-01-01",
    prescribingDoctor: "Self-prescribed",
    notes: "For occasional headaches.",
    durationOfUsage: "Ongoing (1 year)", // Added duration of usage
  },
]

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

// Mock user data with package info
export const mockUser = {
  name: "John Doe",
  email: "john@example.com",
  package: "Standard" as UserPackage,
  credits: 15,
  isPartnerUser: true,
  partnerName: "TechCorp Solutions", // Partner name if user came from partner
}

// Recent applications data
export const recentApplications = [
  // This array is empty by default as shown in the component
  // Applications will be populated when users actually apply to tasks
]

// Smart matches data
export const smartMatches = [
  {
    id: "task-001",
    title: "Senior React Developer",
    salary: "$80-120k",
    type: "Full-time",
    location: "Remote",
    date: "2024-01-15",
    matchScore: "95%",
    description: "We're looking for an experienced React developer to join our team and help build scalable web applications.",
    tags: ["React", "TypeScript", "Node.js", "AWS"],
    company: "TechCorp Solutions",
    verified: true,
    applicants: 12
  },
  {
    id: "task-002",
    title: "UI/UX Designer",
    salary: "$70-100k",
    type: "Contract",
    location: "San Francisco, CA",
    date: "2024-01-14",
    matchScore: "88%",
    description: "Join our design team to create beautiful and intuitive user experiences for our products.",
    tags: ["Figma", "Sketch", "Adobe Creative Suite", "Prototyping"],
    company: "Design Studio Inc",
    verified: true,
    applicants: 8
  }
]

// Updated session notes with IDs and therapy tags
export const sessionNotes = [
  {
    id: "SN-2024-001",
    sessionId: "SES-2024-001",
    date: "2024-09-15",
    therapist: "Dr. Emily White",
    summary: "Initial assessment session. Patient presented with symptoms of anxiety and stress related to work pressure. Discussed coping mechanisms and established treatment goals. Patient showed good engagement and willingness to work on identified issues.",
    therapyType: "Cognitive Behavioral Therapy",
    tags: ["Anxiety", "Stress Management", "CBT"]
  },
  {
    id: "SN-2024-002", 
    sessionId: "SES-2024-002",
    date: "2024-09-22",
    therapist: "Dr. Emily White",
    summary: "Follow-up session focusing on cognitive restructuring. Patient reported improved sleep patterns and reduced anxiety levels. Introduced mindfulness techniques and breathing exercises. Homework assigned for daily practice.",
    therapyType: "Mindfulness-Based Therapy",
    tags: ["Mindfulness", "Breathing Exercises", "Sleep Improvement"]
  },
  {
    id: "SN-2024-003",
    sessionId: "SES-2024-003", 
    date: "2024-09-29",
    therapist: "Dr. Sarah Johnson",
    summary: "Session focused on interpersonal relationships and communication skills. Patient expressed concerns about work relationships. Explored assertiveness training and boundary setting. Good progress noted in applying previous techniques.",
    therapyType: "Interpersonal Therapy",
    tags: ["Communication", "Assertiveness", "Boundaries"]
  }
]
