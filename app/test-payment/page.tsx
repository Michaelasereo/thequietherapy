"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { CreditCard, TestTube, CheckCircle, AlertCircle } from "lucide-react"
import CreditPurchase from "@/components/credit-purchase"
import PaymentStatus from "@/components/payment-status"

export default function TestPaymentPage() {
  const [testMode, setTestMode] = useState<'setup' | 'purchase' | 'status'>('setup')
  const [email, setEmail] = useState('test@example.com')
  const { toast } = useToast()

  const testPaystackConnection = async () => {
    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 100, // 1 NGN test
          email: email,
          metadata: {
            type: 'test',
            user_id: 'test-user',
            user_type: 'user'
          }
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "✅ Paystack Connection Successful!",
          description: "Your Paystack integration is working correctly.",
        })
        setTestMode('purchase')
      } else {
        toast({
          title: "❌ Paystack Connection Failed",
          description: result.error || "Failed to connect to Paystack",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Connection Error",
        description: "Failed to connect to Paystack API",
        variant: "destructive",
      })
    }
  }

  const testCreditPackages = async () => {
    try {
      const response = await fetch('/api/credits/packages')
      const result = await response.json()

      if (result.success && result.packages.length > 0) {
        toast({
          title: "✅ Credit Packages Loaded!",
          description: `Found ${result.packages.length} credit packages available.`,
        })
      } else {
        toast({
          title: "❌ Credit Packages Error",
          description: "Failed to load credit packages",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ API Error",
        description: "Failed to fetch credit packages",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payment System Test</h1>
        <p className="text-gray-600">Test your Paystack integration and payment flow</p>
      </div>

      {/* Test Mode Navigation */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={testMode === 'setup' ? 'default' : 'outline'}
          onClick={() => setTestMode('setup')}
        >
          <TestTube className="h-4 w-4 mr-2" />
          Setup Test
        </Button>
        <Button
          variant={testMode === 'purchase' ? 'default' : 'outline'}
          onClick={() => setTestMode('purchase')}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Credit Purchase
        </Button>
        <Button
          variant={testMode === 'status' ? 'default' : 'outline'}
          onClick={() => setTestMode('status')}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Payment Status
        </Button>
      </div>

      {testMode === 'setup' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Paystack Connection Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Test Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={testPaystackConnection}>
                  Test Paystack Connection
                </Button>
                <Button variant="outline" onClick={testCreditPackages}>
                  Test Credit Packages
                </Button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Test Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Ensure your Paystack API keys are set in environment variables</li>
                  <li>Configure webhook URL: <code className="bg-gray-100 px-1 rounded">http://localhost:3000/api/paystack/webhook</code></li>
                  <li>Click "Test Paystack Connection" to verify API integration</li>
                  <li>Click "Test Credit Packages" to verify database setup</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Environment Variables Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>PAYSTACK_SECRET_KEY: {process.env.PAYSTACK_SECRET_KEY ? '✅ Set' : '❌ Missing'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>PAYSTACK_PUBLIC_KEY: {process.env.PAYSTACK_PUBLIC_KEY ? '✅ Set' : '❌ Missing'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>NEXT_PUBLIC_APP_URL: {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {testMode === 'purchase' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Credit Purchase Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Test the complete credit purchase flow. Use Paystack test cards:
              </p>
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Test Cards:</h4>
                <ul className="space-y-1 text-sm">
                  <li><strong>Success:</strong> 4084 0840 8408 4081</li>
                  <li><strong>Declined:</strong> 4084 0840 8408 4082</li>
                  <li><strong>Insufficient Funds:</strong> 4084 0840 8408 4083</li>
                  <li><strong>Expired:</strong> 4084 0840 8408 4084</li>
                </ul>
                <p className="text-xs mt-2">Use any future expiry date and any 3-digit CVV</p>
              </div>
            </CardContent>
          </Card>

          <CreditPurchase 
            onSuccess={(credits) => {
              toast({
                title: "✅ Purchase Successful!",
                description: `Successfully purchased ${credits} credits.`,
              })
            }}
            onError={(error) => {
              toast({
                title: "❌ Purchase Failed",
                description: error,
                variant: "destructive",
              })
            }}
          />
        </div>
      )}

      {testMode === 'status' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Payment Status Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Test payment status handling. Add these URL parameters to test different scenarios:
              </p>
              <div className="space-y-2 text-sm">
                <div className="bg-green-50 p-3 rounded">
                  <strong>Success:</strong> <code>?payment=success&type=credits&credits=25&reference=TRPI_TEST_123</code>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <strong>Failed:</strong> <code>?payment=failed&error=Insufficient%20funds&reference=TRPI_TEST_456</code>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                  <strong>Pending:</strong> <code>?payment=pending&reference=TRPI_TEST_789</code>
                </div>
              </div>
            </CardContent>
          </Card>

          <PaymentStatus />
        </div>
      )}
    </div>
  )
}
