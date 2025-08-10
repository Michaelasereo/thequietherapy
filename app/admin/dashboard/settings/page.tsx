"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Globe, Bell, Shield, Database, Mail, CreditCard, Save } from "lucide-react"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Platform Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure platform preferences and system settings</p>
        </div>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Platform Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input id="platformName" defaultValue="Trpi Therapy Platform" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platformUrl">Platform URL</Label>
                  <Input id="platformUrl" defaultValue="https://trpi.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input id="supportEmail" defaultValue="support@trpi.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Select defaultValue="africa/lagos">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="africa/lagos">Africa/Lagos (WAT)</SelectItem>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="america/new_york">America/New_York (EST)</SelectItem>
                      <SelectItem value="europe/london">Europe/London (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Session Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionDuration">Default Session Duration (minutes)</Label>
                  <Input id="sessionDuration" type="number" defaultValue="60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionPrice">Default Session Price (₦)</Label>
                  <Input id="sessionPrice" type="number" defaultValue="5000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSessionsPerDay">Max Sessions Per Day</Label>
                  <Input id="maxSessionsPerDay" type="number" defaultValue="8" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowRescheduling">Allow Session Rescheduling</Label>
                  <Switch id="allowRescheduling" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowCancellation">Allow Session Cancellation</Label>
                  <Switch id="allowCancellation" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="welcomeEmails">Welcome Emails</Label>
                  <Switch id="welcomeEmails" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sessionReminders">Session Reminders</Label>
                  <Switch id="sessionReminders" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="paymentConfirmations">Payment Confirmations</Label>
                  <Switch id="paymentConfirmations" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="verificationUpdates">Verification Updates</Label>
                  <Switch id="verificationUpdates" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="marketingEmails">Marketing Emails</Label>
                  <Switch id="marketingEmails" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Push Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sessionAlerts">Session Alerts</Label>
                  <Switch id="sessionAlerts" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="messageNotifications">Message Notifications</Label>
                  <Switch id="messageNotifications" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="systemUpdates">System Updates</Label>
                  <Switch id="systemUpdates" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="promotionalAlerts">Promotional Alerts</Label>
                  <Switch id="promotionalAlerts" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Authentication Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input id="sessionTimeout" type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input id="maxLoginAttempts" type="number" defaultValue="5" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="twoFactorAuth">Require Two-Factor Authentication</Label>
                  <Switch id="twoFactorAuth" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="passwordComplexity">Enforce Password Complexity</Label>
                  <Switch id="passwordComplexity" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ipWhitelist">Enable IP Whitelist</Label>
                  <Switch id="ipWhitelist" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Protection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dataEncryption">Enable Data Encryption</Label>
                  <Switch id="dataEncryption" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auditLogs">Enable Audit Logs</Label>
                  <Switch id="auditLogs" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataRetention">Data Retention Period (days)</Label>
                  <Input id="dataRetention" type="number" defaultValue="2555" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="gdprCompliance">GDPR Compliance</Label>
                  <Switch id="gdprCompliance" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="backupEnabled">Automatic Backups</Label>
                  <Switch id="backupEnabled" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Service
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailProvider">Email Provider</Label>
                  <Select defaultValue="brevo">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brevo">Brevo (Sendinblue)</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="smtp">Custom SMTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input id="apiKey" type="password" placeholder="Enter API key" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input id="fromEmail" defaultValue="noreply@trpi.com" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailEnabled">Enable Email Service</Label>
                  <Switch id="emailEnabled" defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Gateway
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentProvider">Payment Provider</Label>
                  <Select defaultValue="paystack">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paystack">Paystack</SelectItem>
                      <SelectItem value="flutterwave">Flutterwave</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publicKey">Public Key</Label>
                  <Input id="publicKey" placeholder="Enter public key" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secretKey">Secret Key</Label>
                  <Input id="secretKey" type="password" placeholder="Enter secret key" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="paymentEnabled">Enable Payment Gateway</Label>
                  <Switch id="paymentEnabled" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="testMode">Test Mode</Label>
                  <Switch id="testMode" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select defaultValue="ngn">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ngn">Nigerian Naira (₦)</SelectItem>
                      <SelectItem value="usd">US Dollar ($)</SelectItem>
                      <SelectItem value="eur">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platformFee">Platform Fee (%)</Label>
                  <Input id="platformFee" type="number" defaultValue="10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input id="taxRate" type="number" defaultValue="7.5" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoInvoicing">Auto-Generate Invoices</Label>
                  <Switch id="autoInvoicing" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="recurringBilling">Enable Recurring Billing</Label>
                  <Switch id="recurringBilling" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Credit Packages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="basicCredits">Basic Package Credits</Label>
                  <Input id="basicCredits" type="number" defaultValue="10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basicPrice">Basic Package Price (₦)</Label>
                  <Input id="basicPrice" type="number" defaultValue="50000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="standardCredits">Standard Package Credits</Label>
                  <Input id="standardCredits" type="number" defaultValue="20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="standardPrice">Standard Package Price (₦)</Label>
                  <Input id="standardPrice" type="number" defaultValue="100000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proPrice">Pro Package Price (₦)</Label>
                  <Input id="proPrice" type="number" defaultValue="500000" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
