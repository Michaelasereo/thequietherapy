'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Download, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Users,
  CreditCard,
  Database
} from "lucide-react"
import CSVUpload from "@/components/csv-upload"
import { CSVValidator, CSVUtils } from "@/lib/csv-validator"
import { toast } from "sonner"

export default function TestCSVUploadPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isTestingAPI, setIsTestingAPI] = useState(false)

  // Sample test data
  const sampleValidData = [
    {
      name: 'John Doe',
      email: 'john@testcompany.com',
      phone: '+1234567890',
      department: 'Engineering',
      position: 'Software Engineer',
      credits: '10',
      package: 'standard'
    },
    {
      name: 'Jane Smith',
      email: 'jane@testcompany.com',
      phone: '+1987654321',
      department: 'Marketing',
      position: 'Marketing Manager',
      credits: '15',
      package: 'professional'
    },
    {
      name: 'Bob Wilson',
      email: 'bob@testcompany.com',
      phone: '',
      department: 'Sales',
      position: 'Sales Rep',
      credits: '8',
      package: 'basic'
    }
  ]

  const sampleInvalidData = [
    {
      name: '',
      email: 'invalid-email',
      phone: 'invalid-phone',
      department: 'A'.repeat(150), // Too long
      position: 'Manager',
      credits: '-5', // Invalid credits
      package: 'invalid-package'
    },
    {
      name: 'Duplicate User',
      email: 'john@testcompany.com', // Duplicate email
      phone: '+1234567890',
      department: 'IT',
      position: 'Developer',
      credits: '1001', // Too many credits
      package: 'standard'
    }
  ]

  const downloadSampleCSV = (valid: boolean = true) => {
    const data = valid ? sampleValidData : [...sampleValidData, ...sampleInvalidData]
    const csvContent = CSVUtils.arrayToCSV(data)
    const filename = valid ? 'sample-valid-members.csv' : 'sample-invalid-members.csv'
    CSVUtils.downloadCSV(csvContent, filename)
    toast.success(`Downloaded ${filename}`)
  }

  const testValidation = () => {
    console.log('🧪 Testing CSV Validation...')
    
    // Test valid data
    const validResult = CSVValidator.validateCSVData(sampleValidData)
    console.log('✅ Valid data result:', validResult)
    
    // Test invalid data
    const invalidResult = CSVValidator.validateCSVData(sampleInvalidData)
    console.log('❌ Invalid data result:', invalidResult)
    
    // Test mixed data
    const mixedData = [...sampleValidData, ...sampleInvalidData]
    const mixedResult = CSVValidator.validateCSVData(mixedData)
    console.log('🔀 Mixed data result:', mixedResult)
    
    setTestResults({
      valid: validResult,
      invalid: invalidResult,
      mixed: mixedResult
    })
    
    toast.success('Validation tests completed! Check console and results below.')
  }

  const testAPIEndpoint = async () => {
    setIsTestingAPI(true)
    
    try {
      console.log('🧪 Testing API Endpoint...')
      
      // Convert sample data to CSV
      const csvContent = CSVUtils.arrayToCSV(sampleValidData.slice(0, 2)) // Test with 2 records
      console.log('📄 CSV Content:', csvContent)
      
      const response = await fetch('/api/partner/bulk-upload-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/csv'
        },
        body: csvContent
      })
      
      const result = await response.json()
      console.log('🔄 API Response:', result)
      
      if (response.ok) {
        toast.success(`API Test Success: ${result.successfulRecords} records processed`)
        setTestResults((prev: any) => ({ ...prev, api: { success: true, result } }))
      } else {
        toast.error(`API Test Failed: ${result.error}`)
        setTestResults((prev: any) => ({ ...prev, api: { success: false, error: result.error } }))
      }
    } catch (error) {
      console.error('💥 API Test Error:', error)
      toast.error('API test failed - check console for details')
      setTestResults((prev: any) => ({ ...prev, api: { success: false, error: error instanceof Error ? (error as Error).message : 'Unknown error' } }))
    } finally {
      setIsTestingAPI(false)
    }
  }

  const checkDatabaseConnection = async () => {
    try {
      console.log('🔍 Testing Database Connection...')
      
      const response = await fetch('/api/test-db-connection', {
        method: 'GET'
      })
      
      const result = await response.json()
      console.log('🗄️ Database Test:', result)
      
      if (response.ok) {
        toast.success('Database connection successful')
        setTestResults((prev: any) => ({ ...prev, database: { success: true, result } }))
      } else {
        toast.error('Database connection failed')
        setTestResults((prev: any) => ({ ...prev, database: { success: false, error: result.error } }))
      }
    } catch (error) {
      console.error('💥 Database Test Error:', error)
      toast.error('Database test failed')
      setTestResults((prev: any) => ({ ...prev, database: { success: false, error: error instanceof Error ? (error as Error).message : 'Unknown error' } }))
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">CSV Bulk Upload Test Suite</h1>
        <p className="text-muted-foreground">
          Test the partner CSV bulk upload functionality with sample data and validation
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload Test</TabsTrigger>
          <TabsTrigger value="validation">Validation Test</TabsTrigger>
          <TabsTrigger value="samples">Sample Data</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Live CSV Upload Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This will test the actual CSV upload functionality. Make sure you're logged in as a partner user.
                  </AlertDescription>
                </Alert>
                
                <CSVUpload />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Validation Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={testValidation} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Test Validation Logic
                </Button>
                
                <Button 
                  onClick={testAPIEndpoint} 
                  disabled={isTestingAPI}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  {isTestingAPI ? 'Testing API...' : 'Test API Endpoint'}
                </Button>
                
                <Button 
                  onClick={checkDatabaseConnection}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  Test Database
                </Button>
              </div>

              {testResults?.valid && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Validation Test Results:</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-green-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-green-700">Valid Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1 text-sm">
                          <p>Total: {testResults.valid.totalRows}</p>
                          <p>Valid: {testResults.valid.validRows}</p>
                          <p>Errors: {testResults.valid.errors.length}</p>
                          <Badge variant="outline" className="text-green-600">
                            {testResults.valid.isValid ? 'PASS' : 'FAIL'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-red-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-red-700">Invalid Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1 text-sm">
                          <p>Total: {testResults.invalid.totalRows}</p>
                          <p>Valid: {testResults.invalid.validRows}</p>
                          <p>Errors: {testResults.invalid.errors.length}</p>
                          <Badge variant="outline" className="text-red-600">
                            {testResults.invalid.isValid ? 'PASS' : 'FAIL'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-yellow-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-yellow-700">Mixed Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1 text-sm">
                          <p>Total: {testResults.mixed.totalRows}</p>
                          <p>Valid: {testResults.mixed.validRows}</p>
                          <p>Errors: {testResults.mixed.errors.length}</p>
                          <Badge variant="outline" className="text-yellow-600">
                            {testResults.mixed.validRows > 0 ? 'PARTIAL' : 'FAIL'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="samples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Sample CSV Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-700">Valid Sample Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Contains {sampleValidData.length} valid records with proper formatting
                      </p>
                      <Button 
                        onClick={() => downloadSampleCSV(true)} 
                        size="sm"
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Valid Sample
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-700">Invalid Sample Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Contains validation errors for testing error handling
                      </p>
                      <Button 
                        onClick={() => downloadSampleCSV(false)} 
                        size="sm" 
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Invalid Sample
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>CSV Format Requirements:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li><strong>Required:</strong> name, email</li>
                    <li><strong>Optional:</strong> phone, department, position, credits, package</li>
                    <li><strong>Credits:</strong> 1-1000 (default: 5)</li>
                    <li><strong>Packages:</strong> basic, standard, professional, enterprise</li>
                    <li><strong>Phone:</strong> International format (+1234567890)</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Test Results Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!testResults ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No test results yet. Run some tests from the other tabs to see results here.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {testResults.api && (
                    <Card className={testResults.api.success ? "border-green-200" : "border-red-200"}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">API Endpoint Test</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <Badge variant={testResults.api.success ? "default" : "destructive"}>
                            {testResults.api.success ? "SUCCESS" : "FAILED"}
                          </Badge>
                          {testResults.api.success ? (
                            <div>
                              <p>Records processed: {testResults.api.result.successfulRecords}</p>
                              <p>Failed records: {testResults.api.result.failedRecords}</p>
                              <p>Message: {testResults.api.result.message}</p>
                            </div>
                          ) : (
                            <p className="text-red-600">Error: {testResults.api.error}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {testResults.database && (
                    <Card className={testResults.database.success ? "border-green-200" : "border-red-200"}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Database Connection Test</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <Badge variant={testResults.database.success ? "default" : "destructive"}>
                            {testResults.database.success ? "SUCCESS" : "FAILED"}
                          </Badge>
                          {testResults.database.success ? (
                            <p>Database connection successful</p>
                          ) : (
                            <p className="text-red-600">Error: {testResults.database.error}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Full Test Results (JSON):</h4>
                    <pre className="text-xs overflow-auto max-h-64 bg-white p-2 rounded border">
                      {JSON.stringify(testResults, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
