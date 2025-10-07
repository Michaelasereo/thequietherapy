"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useToast } from "@/components/ui/use-toast"
import { Building2, Mail, Phone, Globe, User, Lock } from "lucide-react"
import * as z from "zod"

const formSchema = z.object({
  companyName: z.string().min(2),
  organizationType: z.string(),
  address: z.string().min(2),
  contactPerson: z.string().min(2),
  email: z.string().email(),
  phone: z.string(),
  website: z.string().optional(),
  notifyPurchases: z.boolean(),
  notifyUsage: z.boolean(),
  apiKey: z.string().optional(),
})

type SettingsFormValues = z.infer<typeof formSchema>

interface PartnerData {
  full_name: string
  company_name: string
  organization_type: string
  email: string
  phone: string
  website?: string
  onboarding_data?: {
    phone: string
    website: string
    numberOfEmployees: string
    servicesOffered: string
    targetAudience: string
    partnershipGoals: string
  }
}

export default function PartnerSettingsPage() {
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      organizationType: "",
      address: "",
      contactPerson: "",
      email: "",
      phone: "",
      website: "",
      notifyPurchases: true,
      notifyUsage: true,
      apiKey: "",
    },
  })

  useEffect(() => {
    fetchPartnerData()
  }, [])

  const fetchPartnerData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/partner/me')
      if (response.ok) {
        const data = await response.json()
        setPartnerData(data.partner)
        
        // Set form values from partner data
        form.reset({
          companyName: data.partner?.company_name || data.partner?.full_name || "",
          organizationType: data.partner?.organization_type || "",
          address: data.partner?.onboarding_data?.address || "",
          contactPerson: data.partner?.full_name || "",
          email: data.partner?.email || "",
          phone: data.partner?.phone || data.partner?.onboarding_data?.phone || "",
          website: data.partner?.website || data.partner?.onboarding_data?.website || "",
          notifyPurchases: true,
          notifyUsage: true,
          apiKey: "",
        })
      }
    } catch (error) {
      console.error('Error fetching partner data:', error)
      toast({
        title: "Error",
        description: "Failed to load partner data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  function onSubmit(values: SettingsFormValues) {
    console.log("Partner settings saved:", values)
    toast({
      title: "Settings Updated",
      description: "Your settings have been saved successfully"
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading settings...</p>
        </div>
        <Card className="shadow-sm">
          <CardHeader>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Account Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">View your organization information</p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          <Lock className="h-3 w-3 mr-1" />
          Read Only
        </Badge>
      </div>

      {/* Organization Information */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField 
                  control={form.control} 
                  name="companyName" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Company Name
                      </FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-gray-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                <FormField 
                  control={form.control} 
                  name="organizationType" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Type</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-gray-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                <FormField 
                  control={form.control} 
                  name="contactPerson" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Contact Person
                      </FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-gray-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                <FormField 
                  control={form.control} 
                  name="email" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input type="email" {...field} disabled className="bg-gray-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                <FormField 
                  control={form.control} 
                  name="phone" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-gray-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                <FormField 
                  control={form.control} 
                  name="website" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Website
                      </FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-gray-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField 
                    control={form.control} 
                    name="notifyPurchases" 
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                            disabled
                            className="bg-gray-50"
                          />
                        </FormControl>
                        <FormLabel>Notify credit purchases</FormLabel>
                      </FormItem>
                    )} 
                  />
                  <FormField 
                    control={form.control} 
                    name="notifyUsage" 
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                            disabled
                            className="bg-gray-50"
                          />
                        </FormControl>
                        <FormLabel>Notify session usage</FormLabel>
                      </FormItem>
                    )} 
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Settings are Read-Only</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Your organization information is set during enrollment and cannot be modified here. 
                      Contact support if you need to update your organization details.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}


