import { Home, Users, CreditCard, LineChart, Receipt, Settings, Plus, Upload } from "lucide-react"

export type PartnerMember = {
  id: string
  name: string
  email: string
  creditsAssigned: number
  sessionsUsed: number
  status: "Active" | "Removed"
}

export type CreditTransaction = {
  id: string
  date: string
  type: "Purchase" | "Assignment" | "Deduction"
  member?: string
  creditsIn: number
  creditsOut: number
  balanceAfter: number
}

export type SessionUsage = {
  id: string
  memberName: string
  sessionDate: string
  therapist: string
  creditsUsed: number
  status: "Completed" | "Upcoming" | "Cancelled"
}

export type Payment = {
  id: string
  date: string
  method: "Paystack" | "Bank Transfer"
  creditsBought: number
  amountPaid: number
  status: "Successful" | "Failed"
}

export const partnerSidebarGroups = [
  {
    label: "Main",
    items: [{ name: "Overview", href: "/partner/dashboard", icon: Home }],
  },
  {
    label: "Management",
    items: [
      { name: "Members", href: "/partner/dashboard/members", icon: Users },
      { name: "Credits", href: "/partner/dashboard/credits", icon: CreditCard },
      { name: "Session Reports", href: "/partner/dashboard/reports", icon: LineChart },
      { name: "Payments", href: "/partner/dashboard/payments", icon: Receipt },
    ],
  },
  {
    label: "Account",
    items: [{ name: "Settings", href: "/partner/dashboard/settings", icon: Settings }],
  },
]

// Real data - Will be populated from database
export const partnerSummary = {
  totalCreditsPurchased: 0,
  creditsRemaining: 0,
  activeMembers: 0,
  totalSessionsBooked: 0,
}

export const recentActivity = {
  latestMembers: [],
  latestPurchases: [],
  recentUsage: [],
}

export const partnerMembers: PartnerMember[] = []

export const creditPackages = [
  { id: "pkg100", label: "100 credits", credits: 100, price: 500000 },
  { id: "pkg250", label: "250 credits", credits: 250, price: 1200000 },
  { id: "pkg500", label: "500 credits", credits: 2300000, price: 2300000 },
]

// Partner packages for bulk member uploads
export const partnerPackages = [
  { id: "basic", name: "Basic", credits: 10, price: 50000 },
  { id: "standard", name: "Standard", credits: 20, price: 90000 },
  { id: "pro", name: "Pro", credits: -1, price: 200000 },
]

// Real data - Will be populated from database
export const creditHistory: CreditTransaction[] = []
export const sessionUsage: SessionUsage[] = []
export const payments: Payment[] = []


