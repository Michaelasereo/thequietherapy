import { Home, Calendar, Users, DollarSign, Settings, CheckCircle2, Video } from "lucide-react"

// Therapist Dashboard Sidebar Navigation
export const therapistDashboardSidebarGroups = [
  {
    label: "Main",
    items: [{ name: "Dashboard", href: "/therapist/dashboard", icon: Home }],
  },
  {
    label: "Management",
    items: [
      { name: "Client History", href: "/therapist/dashboard/clients", icon: Users },
      { name: "Client Sessions", href: "/therapist/dashboard/client-sessions", icon: Users },
      { name: "Earnings", href: "/therapist/dashboard/earnings", icon: DollarSign },
      { name: "Verification", href: "/therapist/dashboard/verification", icon: CheckCircle2 },
    ],
  },
  {
    label: "Meetings & Availability",
    items: [
      { name: "Availability", href: "/therapist/dashboard/availability", icon: Calendar },
      { name: "Video Call", href: "/therapist/dashboard/video-call", icon: Video },
    ],
  },
]

export const therapistDashboardBottomNavItems = [
  { name: "Settings", href: "/therapist/dashboard/settings", icon: Settings },
]

// Therapist Dashboard Summary Cards
export const therapistSummaryCards = [
  {
    title: "Total Earnings (MTD)",
    value: "$1,250",
    description: "Month-to-date earnings",
    icon: DollarSign,
  },
  {
    title: "Number of Clients",
    value: "15",
    description: "Active clients this month",
    icon: Users,
  },
  {
    title: "Sessions Completed",
    value: "28",
    description: "Sessions completed this month",
    icon: CheckCircle2,
  },
  {
    title: "Upcoming Sessions",
    value: "5",
    description: "Scheduled for next 7 days",
    icon: Calendar,
  },
]

// Mock data for therapist's upcoming sessions (for calendar and list)
export const therapistUpcomingSessions = [
  {
    id: "ts1",
    clientName: "John Doe",
    date: "2025-09-15",
    time: "10:00 AM",
    type: "Individual Therapy",
    link: "https://meet.google.com/xyz-123-abc",
  },
  {
    id: "ts2",
    clientName: "Jane Smith",
    date: "2025-09-16",
    time: "02:00 PM",
    type: "Couples Counseling",
    link: "https://meet.google.com/def-456-ghi",
  },
  {
    id: "ts3",
    clientName: "Michael Brown",
    date: "2025-09-18",
    time: "11:30 AM",
    type: "Individual Therapy",
    link: "https://meet.google.com/jkl-789-mno",
  },
]

// Mock data for therapist's past sessions
export const therapistPastSessions = [
  {
    id: "tps1",
    clientName: "Alice Wonderland",
    date: "2025-08-28",
    time: "09:00 AM",
    summary: "Discussed anxiety management techniques. Client showed good progress.",
    fullNoteId: "sn1", // Link to a client-side session note if applicable
  },
  {
    id: "tps2",
    clientName: "Bob Builder",
    date: "2025-08-25",
    time: "03:00 PM",
    summary: "Explored career transition challenges. Provided resources for skill development.",
    fullNoteId: "sn2",
  },
]

// Mock data for earnings transactions
export const earningsTransactions = [
  {
    id: "e1",
    date: "2025-09-01",
    description: "Session with John Doe",
    amount: 50.0,
    type: "credit",
  },
  {
    id: "e2",
    date: "2025-09-05",
    description: "Session with Jane Smith",
    amount: 75.0,
    type: "credit",
  },
  {
    id: "e3",
    date: "2025-09-08",
    description: "Payout Request",
    amount: 200.0,
    type: "debit",
  },
  {
    id: "e4",
    date: "2025-09-10",
    description: "Session with Michael Brown",
    amount: 50.0,
    type: "credit",
  },
]

// Mock data for therapist profile
export const therapistProfile = {
  name: "Dr. Alex Therapist",
  email: "therapist@example.com",
  phone: "+1 (555) 123-4567",
  picture: "/placeholder.svg?height=100&width=100",
  bio: "Dr. Alex Therapist is a licensed clinical psychologist with 10 years of experience specializing in CBT and mindfulness-based therapies. He is passionate about helping individuals navigate anxiety, depression, and life transitions. He believes in a collaborative approach, empowering clients to build resilience and achieve their therapeutic goals.",
  specializations: [
    "Cognitive Behavioral Therapy (CBT)",
    "Mindfulness-Based Stress Reduction (MBSR)",
    "Anxiety Disorders",
    "Depression",
  ],
  languages: ["English", "Spanish"],
  mdcnCode: "MDCN12345",
  notificationPreferences: {
    sessionReminders: true,
    newClientAlerts: true,
    payoutNotifications: true,
  },
}

// Mock data for therapist's clients (history)
export const therapistClients = [
  {
    id: "c1",
    name: "John Doe",
    picture: "/placeholder.svg?height=64&width=64",
    lastSeen: "2025-09-10",
    sessions: [
      { id: "cs1", date: "2025-09-10", time: "10:00 AM", type: "Individual Therapy" },
      { id: "cs2", date: "2025-08-28", time: "10:00 AM", type: "Individual Therapy" },
    ],
    notes: [
      {
        id: "cn1",
        date: "2025-08-28",
        summary:
          "Discussed anxiety triggers and introduced breathing exercises. Homework: daily journaling.",
      },
    ],
    medicalHistory: [
      {
        condition: "Generalized Anxiety Disorder (GAD)",
        diagnosisDate: "2023-01-10",
        notes: "Managed with therapy and lifestyle changes.",
      },
    ],
  },
  {
    id: "c2",
    name: "Jane Smith",
    picture: "/placeholder.svg?height=64&width=64",
    lastSeen: "2025-09-05",
    sessions: [
      { id: "cs3", date: "2025-09-05", time: "02:00 PM", type: "Couples Counseling" },
      { id: "cs4", date: "2025-08-25", time: "03:00 PM", type: "Couples Counseling" },
    ],
    notes: [
      {
        id: "cn2",
        date: "2025-08-25",
        summary: "Explored communication patterns and set goals for next session.",
      },
    ],
    medicalHistory: [
      {
        condition: "No significant medical history",
        diagnosisDate: "-",
        notes: "",
      },
    ],
  },
  {
    id: "c3",
    name: "Michael Brown",
    picture: "/placeholder.svg?height=64&width=64",
    lastSeen: "2025-09-01",
    sessions: [
      { id: "cs5", date: "2025-09-01", time: "11:30 AM", type: "Individual Therapy" },
    ],
    notes: [
      {
        id: "cn3",
        date: "2025-09-01",
        summary: "Reviewed progress and updated coping strategies.",
      },
    ],
    medicalHistory: [
      {
        condition: "Mild depression (self-reported)",
        diagnosisDate: "2024-11-12",
        notes: "Improving with therapy and routine changes.",
      },
    ],
  },
]
