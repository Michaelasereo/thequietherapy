"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"

interface AnimatedProgressProps {
  value: number
  previousValue?: number
  className?: string
  showPercentage?: boolean
}

export function AnimatedProgress({ 
  value, 
  previousValue = 0, 
  className = "",
  showPercentage = true 
}: AnimatedProgressProps) {
  const [displayValue, setDisplayValue] = useState(previousValue)

  useEffect(() => {
    // Add a small delay for smoother animation
    const timer = setTimeout(() => {
      setDisplayValue(value)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className={`space-y-2 ${className}`}>
      <Progress 
        value={displayValue} 
        className="h-3 bg-blue-200 transition-all duration-1000 ease-out" 
      />
      {showPercentage && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>{displayValue.toFixed(1)}% complete</span>
          <span className="text-blue-600 font-medium">
            {displayValue > previousValue ? "↗" : ""} 
            {displayValue.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  )
}

interface FundraisingProgressProps {
  raised: number
  target: number
  donors: number
  daysLeft: number
  averageDonation: number
  className?: string
}

export function FundraisingProgress({
  raised,
  target,
  donors,
  daysLeft,
  averageDonation,
  className = ""
}: FundraisingProgressProps) {
  const progressPercentage = Math.min(100, (raised / target) * 100)
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Progress Display */}
      <div className="text-center">
        <div className="text-4xl md:text-5xl font-bold mb-2">
          {formatCurrency(raised)}
        </div>
        <div className="text-lg text-gray-600">
          raised of {formatCurrency(target)} goal
        </div>
      </div>
      
      {/* Animated Progress Bar */}
      <AnimatedProgress 
        value={progressPercentage}
        className="w-full"
      />
      
      {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-4 bg-white/10 rounded-lg">
            <div className="text-2xl font-bold">{donors}</div>
            <div className="text-sm text-gray-300">Donors</div>
          </div>
          <div className="p-4 bg-white/10 rounded-lg">
            <div className="text-2xl font-bold">{daysLeft}</div>
            <div className="text-sm text-gray-300">Days Left</div>
          </div>
          <div className="p-4 bg-white/10 rounded-lg">
            <div className="text-2xl font-bold">
              {donors > 0 ? formatCurrency(averageDonation) : "₦0"}
            </div>
            <div className="text-sm text-gray-300">Avg Donation</div>
          </div>
        </div>
    </div>
  )
}
