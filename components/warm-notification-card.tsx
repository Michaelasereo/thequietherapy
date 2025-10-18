'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReactNode } from "react"

interface WarmNotificationCardProps {
  title: string
  children: ReactNode
  icon?: string
  className?: string
}

export default function WarmNotificationCard({ 
  title, 
  children, 
  icon = "i",
  className = "" 
}: WarmNotificationCardProps) {
  return (
    <Card className={`shadow-sm bg-amber-50 border-amber-200 ${className}`}>
      <CardHeader>
        <CardTitle className="text-slate-800 flex items-center">
          <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-50 flex items-center justify-center text-xs font-bold mr-3">
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-slate-700">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}

interface NotificationItemProps {
  children: ReactNode
  className?: string
}

export function NotificationItem({ children, className = "" }: NotificationItemProps) {
  return (
    <p className={`flex items-start ${className}`}>
      <span className="text-amber-600 mr-2">•</span>
      <span>{children}</span>
    </p>
  )
}
