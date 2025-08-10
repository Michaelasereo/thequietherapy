import { 
  Home, 
  Users, 
  Building2, 
  UserCheck, 
  CreditCard, 
  Calendar, 
  Settings, 
  Shield, 
  BarChart3, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Activity
} from "lucide-react"

// Admin Dashboard Sidebar Navigation
export const adminSidebarGroups = [
  {
    label: "Main",
    items: [{ name: "Dashboard", href: "/admin/dashboard", icon: Home }],
  },
  {
    label: "User Management",
    items: [
      { name: "All Users", href: "/admin/dashboard/users", icon: Users },
      { name: "Therapists", href: "/admin/dashboard/therapists", icon: UserCheck },
      { name: "Partners", href: "/admin/dashboard/partners", icon: Building2 },
      { name: "Pending Verifications", href: "/admin/dashboard/verifications", icon: AlertTriangle },
    ],
  },
  {
    label: "Platform Management",
    items: [
      { name: "Sessions", href: "/admin/dashboard/sessions", icon: Calendar },
      { name: "Credits & Payments", href: "/admin/dashboard/payments", icon: CreditCard },
      { name: "Reports & Analytics", href: "/admin/dashboard/analytics", icon: BarChart3 },
      { name: "Content Management", href: "/admin/dashboard/content", icon: FileText },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Platform Settings", href: "/admin/dashboard/settings", icon: Settings },
      { name: "Security & Access", href: "/admin/dashboard/security", icon: Shield },
    ],
  },
]

export const adminBottomNavItems = [
  { name: "Profile", href: "/admin/dashboard/profile", icon: Shield },
]

// Admin Dashboard Summary Data
export const adminSummary = {
  totalUsers: 1250,
  totalTherapists: 45,
  totalPartners: 28,
  totalSessions: 3450,
  pendingVerifications: 12,
  totalRevenue: 2500000,
  activeSessions: 23,
  platformHealth: "Excellent"
}

// Mock data for admin dashboard
export const recentActivities = [
  { id: "1", type: "user_registration", user: "John Doe", time: "2 minutes ago", status: "completed" },
  { id: "2", type: "therapist_verification", user: "Dr. Sarah Johnson", time: "15 minutes ago", status: "pending" },
  { id: "3", type: "partner_onboarding", user: "TechCorp Solutions", time: "1 hour ago", status: "completed" },
  { id: "4", type: "payment_processed", user: "Partner XYZ", time: "2 hours ago", status: "completed" },
  { id: "5", type: "session_completed", user: "Session #1234", time: "3 hours ago", status: "completed" },
]

export const pendingVerifications = [
  { id: "v1", type: "therapist", name: "Dr. Emily White", email: "emily@example.com", submitted: "2024-01-15", status: "pending" },
  { id: "v2", type: "therapist", name: "Dr. Michael Brown", email: "michael@example.com", submitted: "2024-01-14", status: "pending" },
  { id: "v3", type: "partner", name: "HealthCorp Ltd", email: "admin@healthcorp.com", submitted: "2024-01-13", status: "pending" },
]

export const platformStats = {
  dailyActiveUsers: 450,
  weeklyActiveUsers: 1200,
  monthlyActiveUsers: 3800,
  sessionCompletionRate: 94.5,
  averageSessionDuration: 52,
  userSatisfactionScore: 4.8,
  therapistRetentionRate: 96.2,
  partnerRetentionRate: 89.5
}

export const revenueData = {
  monthlyRevenue: 2500000,
  previousMonthRevenue: 2200000,
  growthRate: 13.6,
  topRevenueSources: [
    { source: "Individual Sessions", amount: 1200000, percentage: 48 },
    { source: "Partner Subscriptions", amount: 800000, percentage: 32 },
    { source: "Premium Features", amount: 300000, percentage: 12 },
    { source: "Other", amount: 200000, percentage: 8 },
  ]
}

export const systemHealth = {
  uptime: 99.9,
  responseTime: 245,
  errorRate: 0.1,
  activeConnections: 1250,
  serverLoad: 45,
  databaseHealth: "Optimal",
  cacheHitRate: 92.5
}
