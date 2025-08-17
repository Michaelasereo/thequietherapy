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
import { supabase } from './supabase'

// Admin Dashboard Sidebar Navigation
export const adminSidebarGroups = [
  {
    label: "Main",
    items: [{ name: "Dashboard", href: "/admin/dashboard", icon: Home }],
  },
  {
    label: "User Management",
    items: [
      { name: "Users", href: "/admin/dashboard/users", icon: Users },
      { name: "Therapists", href: "/admin/dashboard/therapists", icon: UserCheck },
      { name: "Partners", href: "/admin/dashboard/partners", icon: Building2 },
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

// Note: Data fetching functions have been moved to API routes for security
// These functions should be called from server components or API routes
// that have access to the service role key

// HIPAA Compliance Settings
export const hipaaComplianceSettings = {
  dataEncryption: {
    enabled: true,
    algorithm: 'AES-256-GCM',
    keyRotationDays: 90,
    encryptedFields: ['medical_history', 'biodata', 'session_notes', 'payment_info']
  },
  auditLogging: {
    enabled: true,
    retentionDays: 2555, // 7 years as per HIPAA
    logEvents: ['login', 'logout', 'data_access', 'data_modification', 'data_export', 'session_access']
  },
  accessControl: {
    twoFactorAuth: true,
    sessionTimeout: 30, // minutes
    maxLoginAttempts: 5,
    passwordComplexity: true,
    ipWhitelist: false
  },
  dataRetention: {
    patientData: 2555, // 7 years
    sessionRecords: 2555, // 7 years
    auditLogs: 2555, // 7 years
    backupRetention: 365 // 1 year
  },
  breachNotification: {
    enabled: true,
    notificationTimeframe: 60, // days
    contactEmail: 'privacy@trpi.com'
  }
}

// Utility functions
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
  return `${Math.floor(diffInMinutes / 1440)} days ago`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

// Export default data for fallback
export const adminSummary = {
  totalUsers: 0,
  totalTherapists: 0,
  totalPartners: 0,
  totalSessions: 0,
  pendingVerifications: 0,
  totalRevenue: 0,
  activeSessions: 0,
  platformHealth: "Unknown"
}

export const recentActivities = []
export const pendingVerifications = []
