"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Globe, Bell, Shield, Database, Mail, CreditCard, Save, AlertTriangle, Lock, FileText, Users } from "lucide-react"
import { toast } from "sonner"
import { hipaaComplianceSettings } from "@/lib/admin-data"

export default function AdminSettingsPage() {
  // State for all settings
  const [settings, setSettings] = useState({
    general: {
      platformName: "Trpi Therapy Platform",
      platformUrl: "https://trpi.com",
      supportEmail: "support@trpi.com",
      timezone: "africa/lagos",
      sessionDuration: 60,
      sessionPrice: 5000,
      maxSessionsPerDay: 8,
      allowRescheduling: true,
      allowCancellation: true
    },
    notifications: {
      welcomeEmails: true,
      sessionReminders: true,
      paymentConfirmations: true,
      verificationUpdates: true,
      marketingEmails: false,
      sessionAlerts: true,
      messageNotifications: true,
      systemUpdates: false,
      promotionalAlerts: false
    },
    security: {
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      twoFactorAuth: false,
      passwordComplexity: true,
      ipWhitelist: false,
      dataEncryption: true,
      auditLogs: true,
      dataRetention: 2555,
      gdprCompliance: true,
      backupEnabled: true
    },
    hipaa: {
      dataEncryption: true,
      auditLogging: true,
      accessControl: true,
      dataRetention: 2555,
      breachNotification: true,
      encryptionAlgorithm: 'AES-256-GCM',
      keyRotationDays: 90,
      logRetentionDays: 2555,
      twoFactorAuth: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordComplexity: true,
      patientDataRetention: 2555,
      sessionRecordsRetention: 2555,
      auditLogsRetention: 2555,
      backupRetention: 365,
      notificationTimeframe: 60,
      contactEmail: 'privacy@trpi.com'
    },
    billing: {
      currency: "ngn",
      platformFee: 10,
      taxRate: 7.5,
      autoInvoicing: true,
      recurringBilling: false,
      basicCredits: 10,
      basicPrice: 50000,
      standardCredits: 20,
      standardPrice: 100000,
      proPrice: 500000
    }
  })

  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('adminSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  // Track changes
  useEffect(() => {
    setHasChanges(true)
  }, [settings])

  const handleSettingChange = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }))
  }

  const handleSaveChanges = async () => {
    setLoading(true)
    try {
      // Save to localStorage
      localStorage.setItem('adminSettings', JSON.stringify(settings))
      
      // Here you would typically save to the database
      // await saveSettingsToDatabase(settings)
      
      toast.success("Settings saved successfully")
      setHasChanges(false)
    } catch (error) {
      toast.error("Failed to save settings")
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleHIPAAComplianceToggle = (key: string, value: boolean) => {
    handleSettingChange('hipaa', key, value)
    
    // Show compliance notification
    if (value) {
      toast.success(`HIPAA ${key.replace(/([A-Z])/g, ' $1').toLowerCase()} enabled`)
    }
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Platform Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure platform preferences and system settings</p>
        </div>
        <Button onClick={handleSaveChanges} disabled={loading || !hasChanges}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="hipaa">HIPAA Compliance</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
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
                  <Input 
                    id="platformName" 
                    value={settings.general.platformName}
                    onChange={(e) => handleSettingChange('general', 'platformName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platformUrl">Platform URL</Label>
                  <Input 
                    id="platformUrl" 
                    value={settings.general.platformUrl}
                    onChange={(e) => handleSettingChange('general', 'platformUrl', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input 
                    id="supportEmail" 
                    value={settings.general.supportEmail}
                    onChange={(e) => handleSettingChange('general', 'supportEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Select 
                    value={settings.general.timezone}
                    onValueChange={(value) => handleSettingChange('general', 'timezone', value)}
                  >
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
                  <Input 
                    id="sessionDuration" 
                    type="number" 
                    value={settings.general.sessionDuration}
                    onChange={(e) => handleSettingChange('general', 'sessionDuration', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionPrice">Default Session Price (₦)</Label>
                  <Input 
                    id="sessionPrice" 
                    type="number" 
                    value={settings.general.sessionPrice}
                    onChange={(e) => handleSettingChange('general', 'sessionPrice', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSessionsPerDay">Max Sessions Per Day</Label>
                  <Input 
                    id="maxSessionsPerDay" 
                    type="number" 
                    value={settings.general.maxSessionsPerDay}
                    onChange={(e) => handleSettingChange('general', 'maxSessionsPerDay', parseInt(e.target.value))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowRescheduling">Allow Session Rescheduling</Label>
                  <Switch 
                    id="allowRescheduling" 
                    checked={settings.general.allowRescheduling}
                    onCheckedChange={(checked) => handleSettingChange('general', 'allowRescheduling', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowCancellation">Allow Session Cancellation</Label>
                  <Switch 
                    id="allowCancellation" 
                    checked={settings.general.allowCancellation}
                    onCheckedChange={(checked) => handleSettingChange('general', 'allowCancellation', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
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
                  <Switch 
                    id="welcomeEmails" 
                    checked={settings.notifications.welcomeEmails}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'welcomeEmails', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sessionReminders">Session Reminders</Label>
                  <Switch 
                    id="sessionReminders" 
                    checked={settings.notifications.sessionReminders}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'sessionReminders', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="paymentConfirmations">Payment Confirmations</Label>
                  <Switch 
                    id="paymentConfirmations" 
                    checked={settings.notifications.paymentConfirmations}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'paymentConfirmations', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="verificationUpdates">Verification Updates</Label>
                  <Switch 
                    id="verificationUpdates" 
                    checked={settings.notifications.verificationUpdates}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'verificationUpdates', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="marketingEmails">Marketing Emails</Label>
                  <Switch 
                    id="marketingEmails" 
                    checked={settings.notifications.marketingEmails}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'marketingEmails', checked)}
                  />
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
                  <Switch 
                    id="sessionAlerts" 
                    checked={settings.notifications.sessionAlerts}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'sessionAlerts', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="messageNotifications">Message Notifications</Label>
                  <Switch 
                    id="messageNotifications" 
                    checked={settings.notifications.messageNotifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'messageNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="systemUpdates">System Updates</Label>
                  <Switch 
                    id="systemUpdates" 
                    checked={settings.notifications.systemUpdates}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'systemUpdates', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="promotionalAlerts">Promotional Alerts</Label>
                  <Switch 
                    id="promotionalAlerts" 
                    checked={settings.notifications.promotionalAlerts}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'promotionalAlerts', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
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
                  <Input 
                    id="sessionTimeout" 
                    type="number" 
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input 
                    id="maxLoginAttempts" 
                    type="number" 
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="twoFactorAuth">Require Two-Factor Authentication</Label>
                  <Switch 
                    id="twoFactorAuth" 
                    checked={settings.security.twoFactorAuth}
                    onCheckedChange={(checked) => handleSettingChange('security', 'twoFactorAuth', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="passwordComplexity">Enforce Password Complexity</Label>
                  <Switch 
                    id="passwordComplexity" 
                    checked={settings.security.passwordComplexity}
                    onCheckedChange={(checked) => handleSettingChange('security', 'passwordComplexity', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ipWhitelist">Enable IP Whitelist</Label>
                  <Switch 
                    id="ipWhitelist" 
                    checked={settings.security.ipWhitelist}
                    onCheckedChange={(checked) => handleSettingChange('security', 'ipWhitelist', checked)}
                  />
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
                  <Switch 
                    id="dataEncryption" 
                    checked={settings.security.dataEncryption}
                    onCheckedChange={(checked) => handleSettingChange('security', 'dataEncryption', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auditLogs">Enable Audit Logs</Label>
                  <Switch 
                    id="auditLogs" 
                    checked={settings.security.auditLogs}
                    onCheckedChange={(checked) => handleSettingChange('security', 'auditLogs', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataRetention">Data Retention Period (days)</Label>
                  <Input 
                    id="dataRetention" 
                    type="number" 
                    value={settings.security.dataRetention}
                    onChange={(e) => handleSettingChange('security', 'dataRetention', parseInt(e.target.value))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="gdprCompliance">GDPR Compliance</Label>
                  <Switch 
                    id="gdprCompliance" 
                    checked={settings.security.gdprCompliance}
                    onCheckedChange={(checked) => handleSettingChange('security', 'gdprCompliance', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="backupEnabled">Automatic Backups</Label>
                  <Switch 
                    id="backupEnabled" 
                    checked={settings.security.backupEnabled}
                    onCheckedChange={(checked) => handleSettingChange('security', 'backupEnabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hipaa" className="space-y-4">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">HIPAA Compliance</h3>
            </div>
            <p className="text-sm text-blue-700">
              These settings ensure compliance with the Health Insurance Portability and Accountability Act (HIPAA) 
              requirements for protecting patient health information.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Data Encryption & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="hipaaDataEncryption">Enable Data Encryption</Label>
                  <Switch 
                    id="hipaaDataEncryption" 
                    checked={settings.hipaa.dataEncryption}
                    onCheckedChange={(checked) => handleHIPAAComplianceToggle('dataEncryption', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="encryptionAlgorithm">Encryption Algorithm</Label>
                  <Select 
                    value={settings.hipaa.encryptionAlgorithm}
                    onValueChange={(value) => handleSettingChange('hipaa', 'encryptionAlgorithm', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AES-256-GCM">AES-256-GCM (Recommended)</SelectItem>
                      <SelectItem value="AES-256-CBC">AES-256-CBC</SelectItem>
                      <SelectItem value="ChaCha20-Poly1305">ChaCha20-Poly1305</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keyRotationDays">Key Rotation Period (days)</Label>
                  <Input 
                    id="keyRotationDays" 
                    type="number" 
                    value={settings.hipaa.keyRotationDays}
                    onChange={(e) => handleSettingChange('hipaa', 'keyRotationDays', parseInt(e.target.value))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="hipaaAuditLogging">Enable Audit Logging</Label>
                  <Switch 
                    id="hipaaAuditLogging" 
                    checked={settings.hipaa.auditLogging}
                    onCheckedChange={(checked) => handleHIPAAComplianceToggle('auditLogging', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logRetentionDays">Audit Log Retention (days)</Label>
                  <Input 
                    id="logRetentionDays" 
                    type="number" 
                    value={settings.hipaa.logRetentionDays}
                    onChange={(e) => handleSettingChange('hipaa', 'logRetentionDays', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Access Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="hipaaAccessControl">Strict Access Control</Label>
                  <Switch 
                    id="hipaaAccessControl" 
                    checked={settings.hipaa.accessControl}
                    onCheckedChange={(checked) => handleHIPAAComplianceToggle('accessControl', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="hipaaTwoFactorAuth">Require Two-Factor Authentication</Label>
                  <Switch 
                    id="hipaaTwoFactorAuth" 
                    checked={settings.hipaa.twoFactorAuth}
                    onCheckedChange={(checked) => handleSettingChange('hipaa', 'twoFactorAuth', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hipaaSessionTimeout">Session Timeout (minutes)</Label>
                  <Input 
                    id="hipaaSessionTimeout" 
                    type="number" 
                    value={settings.hipaa.sessionTimeout}
                    onChange={(e) => handleSettingChange('hipaa', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hipaaMaxLoginAttempts">Max Login Attempts</Label>
                  <Input 
                    id="hipaaMaxLoginAttempts" 
                    type="number" 
                    value={settings.hipaa.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('hipaa', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="hipaaPasswordComplexity">Enforce Password Complexity</Label>
                  <Switch 
                    id="hipaaPasswordComplexity" 
                    checked={settings.hipaa.passwordComplexity}
                    onCheckedChange={(checked) => handleSettingChange('hipaa', 'passwordComplexity', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Data Retention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patientDataRetention">Patient Data Retention (days)</Label>
                  <Input 
                    id="patientDataRetention" 
                    type="number" 
                    value={settings.hipaa.patientDataRetention}
                    onChange={(e) => handleSettingChange('hipaa', 'patientDataRetention', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionRecordsRetention">Session Records Retention (days)</Label>
                  <Input 
                    id="sessionRecordsRetention" 
                    type="number" 
                    value={settings.hipaa.sessionRecordsRetention}
                    onChange={(e) => handleSettingChange('hipaa', 'sessionRecordsRetention', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auditLogsRetention">Audit Logs Retention (days)</Label>
                  <Input 
                    id="auditLogsRetention" 
                    type="number" 
                    value={settings.hipaa.auditLogsRetention}
                    onChange={(e) => handleSettingChange('hipaa', 'auditLogsRetention', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backupRetention">Backup Retention (days)</Label>
                  <Input 
                    id="backupRetention" 
                    type="number" 
                    value={settings.hipaa.backupRetention}
                    onChange={(e) => handleSettingChange('hipaa', 'backupRetention', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Breach Notification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="breachNotification">Enable Breach Notification</Label>
                  <Switch 
                    id="breachNotification" 
                    checked={settings.hipaa.breachNotification}
                    onCheckedChange={(checked) => handleHIPAAComplianceToggle('breachNotification', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notificationTimeframe">Notification Timeframe (days)</Label>
                  <Input 
                    id="notificationTimeframe" 
                    type="number" 
                    value={settings.hipaa.notificationTimeframe}
                    onChange={(e) => handleSettingChange('hipaa', 'notificationTimeframe', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Privacy Contact Email</Label>
                  <Input 
                    id="contactEmail" 
                    type="email" 
                    value={settings.hipaa.contactEmail}
                    onChange={(e) => handleSettingChange('hipaa', 'contactEmail', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
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
                  <Select 
                    value={settings.billing.currency}
                    onValueChange={(value) => handleSettingChange('billing', 'currency', value)}
                  >
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
                  <Input 
                    id="platformFee" 
                    type="number" 
                    value={settings.billing.platformFee}
                    onChange={(e) => handleSettingChange('billing', 'platformFee', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input 
                    id="taxRate" 
                    type="number" 
                    value={settings.billing.taxRate}
                    onChange={(e) => handleSettingChange('billing', 'taxRate', parseFloat(e.target.value))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoInvoicing">Auto-Generate Invoices</Label>
                  <Switch 
                    id="autoInvoicing" 
                    checked={settings.billing.autoInvoicing}
                    onCheckedChange={(checked) => handleSettingChange('billing', 'autoInvoicing', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="recurringBilling">Enable Recurring Billing</Label>
                  <Switch 
                    id="recurringBilling" 
                    checked={settings.billing.recurringBilling}
                    onCheckedChange={(checked) => handleSettingChange('billing', 'recurringBilling', checked)}
                  />
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
                  <Input 
                    id="basicCredits" 
                    type="number" 
                    value={settings.billing.basicCredits}
                    onChange={(e) => handleSettingChange('billing', 'basicCredits', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basicPrice">Basic Package Price (₦)</Label>
                  <Input 
                    id="basicPrice" 
                    type="number" 
                    value={settings.billing.basicPrice}
                    onChange={(e) => handleSettingChange('billing', 'basicPrice', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="standardCredits">Standard Package Credits</Label>
                  <Input 
                    id="standardCredits" 
                    type="number" 
                    value={settings.billing.standardCredits}
                    onChange={(e) => handleSettingChange('billing', 'standardCredits', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="standardPrice">Standard Package Price (₦)</Label>
                  <Input 
                    id="standardPrice" 
                    type="number" 
                    value={settings.billing.standardPrice}
                    onChange={(e) => handleSettingChange('billing', 'standardPrice', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proPrice">Pro Package Price (₦)</Label>
                  <Input 
                    id="proPrice" 
                    type="number" 
                    value={settings.billing.proPrice}
                    onChange={(e) => handleSettingChange('billing', 'proPrice', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
