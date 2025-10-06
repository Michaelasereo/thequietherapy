"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Zap } from "lucide-react"
import { useState } from "react"

interface PricingCardProps {
  packageType: 'single' | 'bronze' | 'silver' | 'gold'
  title: string
  description?: string
  price: number // in kobo
  sessions: number
  sessionDuration: number // in minutes
  saving?: number // in kobo
  recommended?: boolean
  onPurchase?: (packageType: string) => void
  loading?: boolean
}

export function PricingCard({
  packageType,
  title,
  description,
  price,
  sessions,
  sessionDuration,
  saving = 0,
  recommended = false,
  onPurchase,
  loading = false
}: PricingCardProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const formatPrice = (kobo: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(kobo / 100)
  }

  const pricePerSession = Math.round(price / sessions)

  const handlePurchase = async () => {
    if (!onPurchase || isProcessing) return
    
    setIsProcessing(true)
    try {
      await onPurchase(packageType)
    } finally {
      setIsProcessing(false)
    }
  }

  const getButtonText = () => {
    if (isProcessing || loading) return "Processing..."
    if (saving > 0) return `Save ${formatPrice(saving)}`
    if (packageType === 'single') return "Buy One Session"
    return `Get ${sessions} Sessions`
  }

  const getCardStyle = () => {
    if (recommended) {
      return "border-2 border-blue-500 shadow-lg scale-105 relative"
    }
    return "border border-gray-200 hover:border-gray-300 transition-colors"
  }

  return (
    <Card className={getCardStyle()}>
      {recommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge variant="default" className="bg-blue-500 text-white px-3 py-1">
            <Zap className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
        
        <div className="mt-4">
          <div className="text-3xl font-bold text-gray-900">
            {formatPrice(price)}
          </div>
          <div className="text-sm text-gray-500">
            {formatPrice(pricePerSession)} per session
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
            <span>{sessions} therapy session{sessions > 1 ? 's' : ''}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <Clock className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
            <span>{sessionDuration} minutes per session</span>
          </div>
          
          {saving > 0 && (
            <div className="flex items-center text-sm text-green-600 font-medium">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
              <span>Save {formatPrice(saving)} total</span>
            </div>
          )}
          
          <div className="flex items-center text-sm">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
            <span>Licensed therapists</span>
          </div>
          
          <div className="flex items-center text-sm">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
            <span>Secure video sessions</span>
          </div>
        </div>

        <Button 
          onClick={handlePurchase}
          disabled={isProcessing || loading}
          className={`w-full ${recommended ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
          size="lg"
        >
          {getButtonText()}
        </Button>
        
        {sessions > 1 && (
          <p className="text-xs text-center text-gray-500 mt-2">
            Credits don't expire
          </p>
        )}
      </CardContent>
    </Card>
  )
}
