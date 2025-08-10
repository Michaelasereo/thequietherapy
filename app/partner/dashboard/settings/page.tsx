"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
  companyName: z.string().min(2),
  address: z.string().min(2),
  contactPerson: z.string().min(2),
  email: z.string().email(),
  notifyPurchases: z.boolean().default(true),
  notifyUsage: z.boolean().default(true),
  apiKey: z.string().optional(),
})

type SettingsFormValues = z.infer<typeof formSchema>

export default function PartnerSettingsPage() {
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "Acme Corp",
      address: "123 Market St, Lagos",
      contactPerson: "Jane Doe",
      email: "partner@example.com",
      notifyPurchases: true,
      notifyUsage: true,
      apiKey: "",
    },
  })

  function onSubmit(values: SettingsFormValues) {
    console.log("Partner settings saved:", values)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Account Settings</h2>

      <Card className="shadow-sm">
        <CardHeader><CardTitle>Company Info</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="notifyPurchases" render={({ field }) => (
                  <FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Notify credit purchases</FormLabel></FormItem>
                )} />
                <FormField control={form.control} name="notifyUsage" render={({ field }) => (
                  <FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Notify session usage</FormLabel></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="apiKey" render={({ field }) => (
                <FormItem><FormLabel>API Key</FormLabel><FormControl><Input placeholder="(optional)" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <Button type="submit">Save</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}


