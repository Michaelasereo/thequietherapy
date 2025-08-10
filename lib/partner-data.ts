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

export const partnerSummary = {
  totalCreditsPurchased: 1000,
  creditsRemaining: 640,
  activeMembers: 24,
  totalSessionsBooked: 180,
}

export const recentActivity = {
  latestMembers: [
    { id: "m31", name: "Ada Lovelace", email: "ada@example.com" },
    { id: "m32", name: "Grace Hopper", email: "grace@example.com" },
  ],
  latestPurchases: [
    { id: "p21", date: "2025-09-10", credits: 200, amount: 100000 },
  ],
  recentUsage: [
    { id: "u91", member: "John Doe", date: "2025-09-09", credits: 5 },
  ],
}

export const partnerMembers: PartnerMember[] = [
  { id: "m1", name: "John Doe", email: "john@example.com", creditsAssigned: 40, sessionsUsed: 8, status: "Active" },
  { id: "m2", name: "Jane Smith", email: "jane@example.com", creditsAssigned: 30, sessionsUsed: 5, status: "Active" },
  { id: "m3", name: "Bob Lee", email: "bob@example.com", creditsAssigned: 0, sessionsUsed: 0, status: "Removed" },
]

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

export const creditHistory: CreditTransaction[] = [
  { id: "t1", date: "2025-09-01", type: "Purchase", creditsIn: 200, creditsOut: 0, balanceAfter: 800 },
  { id: "t2", date: "2025-09-03", type: "Assignment", member: "John Doe", creditsIn: 0, creditsOut: 20, balanceAfter: 780 },
  { id: "t3", date: "2025-09-07", type: "Deduction", member: "John Doe", creditsIn: 0, creditsOut: 5, balanceAfter: 775 },
]

export const sessionUsage: SessionUsage[] = [
  { id: "s1", memberName: "John Doe", sessionDate: "2025-09-07", therapist: "Dr. Emily White", creditsUsed: 5, status: "Completed" },
  { id: "s2", memberName: "Jane Smith", sessionDate: "2025-09-12", therapist: "Mr. John Davis", creditsUsed: 5, status: "Upcoming" },
]

export const payments: Payment[] = [
  { id: "pm1", date: "2025-09-01", method: "Paystack", creditsBought: 200, amountPaid: 1000000, status: "Successful" },
  { id: "pm2", date: "2025-08-10", method: "Bank Transfer", creditsBought: 100, amountPaid: 500000, status: "Successful" },
]


