'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  FileText, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  X,
  Download,
  Eye,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import * as XLSX from 'xlsx'

interface CSVRow {
  firstname: string
  email: string
  statustype: 'doctor' | 'student'
  caderlevel: string
  phone?: string
  department?: string
  employeeid?: string
}

interface ValidationError {
  row: number
  field: string
  message: string
}

interface UploadResult {
  success: boolean
  message: string
  successfulRecords: number
  failedRecords: number
  errors: ValidationError[]
}

export default function CSVUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<CSVRow[]>([])
  const [preview, setPreview] = useState<CSVRow[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Please select a valid CSV or Excel file')
      return
    }

    setFile(selectedFile)
    await processFile(selectedFile)
  }

  const processFile = async (file: File) => {
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as CSVRow[]

      setData(jsonData)
      setPreview(jsonData.slice(0, 5)) // Show first 5 rows for preview
      
      // Validate data
      const validationErrors = validateData(jsonData)
      setErrors(validationErrors)
      
      if (validationErrors.length > 0) {
        toast.error(`${validationErrors.length} validation errors found`)
      } else {
        toast.success(`File loaded successfully! ${jsonData.length} members found`)
      }
    } catch (error) {
      console.error('Error processing file:', error)
      toast.error('Failed to process file. Please check the format.')
    }
  }

  const validateData = (rows: CSVRow[]): ValidationError[] => {
    const errors: ValidationError[] = []
    
    rows.forEach((row, index) => {
      const rowNumber = index + 2 // +2 because Excel is 1-indexed and has header

      // Required fields
      if (!row.firstname || row.firstname.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'firstname',
          message: 'First name is required'
        })
      }

      if (!row.email || row.email.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'email',
          message: 'Email is required'
        })
      } else if (!isValidEmail(row.email)) {
        errors.push({
          row: rowNumber,
          field: 'email',
          message: 'Invalid email format'
        })
      }

      if (!row.statustype || row.statustype.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'statustype',
          message: 'Status type is required'
        })
      } else if (!['doctor', 'student'].includes(row.statustype.toLowerCase())) {
        errors.push({
          row: rowNumber,
          field: 'statustype',
          message: 'Status type must be "doctor" or "student"'
        })
      }

      if (!row.caderlevel || row.caderlevel.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'caderlevel',
          message: 'Cader/Level is required'
        })
      }

      // Optional phone validation
      if (row.phone && !isValidPhone(row.phone)) {
        errors.push({
          row: rowNumber,
          field: 'phone',
          message: 'Invalid phone format'
        })
      }

      // Employee ID validation (optional)
      if (row.employeeid && row.employeeid.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'employeeid',
          message: 'Employee ID cannot be empty if provided'
        })
      }
    })

    return errors
  }

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  const handleUpload = async () => {
    if (!data.length || errors.length > 0) {
      toast.error('Please fix validation errors before uploading')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Convert data back to CSV format for the API
      const headers = ['firstname', 'email', 'statustype', 'caderlevel', 'phone', 'department', 'employeeid']
      const csvRows = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
          const value = (row as any)[header] || ''
          // Escape commas and quotes in CSV values
          return value.toString().includes(',') ? `"${value}"` : value
        }).join(','))
      ]
      const csvContent = csvRows.join('\n')

      // Simulate progress for better UX
      const interval = setInterval(() => {
        setUploadProgress((prev: any) => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 300)

      const response = await fetch('/api/partner/upload-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/csv'
        },
        body: csvContent
      })

      clearInterval(interval)
      setUploadProgress(100)

      const result = await response.json()

      if (response.ok) {
        setUploadResult(result)
        toast.success(`Upload completed! ${result.successfulRecords} members added, ${result.failedRecords} failed`)
        
        // Reset form
        setFile(null)
        setData([])
        setPreview([])
        setErrors([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        toast.error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const downloadTemplate = () => {
    const template = [
      {
        firstname: 'John',
        email: 'john.doe@hospital.com',
        statustype: 'doctor',
        caderlevel: 'consultant',
        phone: '+2348012345678',
        department: 'Cardiology',
        employeeid: 'EMP001'
      },
      {
        firstname: 'Sarah',
        email: 'sarah.smith@hospital.com',
        statustype: 'doctor',
        caderlevel: 'resident',
        phone: '+2348012345679',
        department: 'Neurology',
        employeeid: 'EMP002'
      },
      {
        firstname: 'Michael',
        email: 'michael.johnson@university.edu',
        statustype: 'student',
        caderlevel: '300level',
        phone: '+2348012345680',
        department: 'Medicine',
        employeeid: 'STU001'
      },
      {
        firstname: 'Emily',
        email: 'emily.brown@university.edu',
        statustype: 'student',
        caderlevel: '400level',
        phone: '+2348012345681',
        department: 'Medicine',
        employeeid: 'STU002'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'partner-member-template.xlsx')
  }

  const clearFile = () => {
    setFile(null)
    setData([])
    setPreview([])
    setErrors([])
    setUploadResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Member Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!file ? (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-lg font-medium">Upload CSV or Excel file</p>
                  <p className="text-sm text-gray-500">
                    Drag and drop your file here, or click to browse
                  </p>
                </div>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Choose File
                </Button>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span className="font-medium">{file.name}</span>
                    <Badge variant="secondary">{data.length} members</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {errors.length} validation errors found. Please fix them before uploading.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpload} 
                    disabled={uploading || errors.length > 0}
                    className="flex-1"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload {data.length} Members
                      </>
                    )}
                  </Button>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-gray-500">Uploading members...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preview Table */}
          {preview.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Preview (First 5 rows)</h3>
                <Badge variant="outline">{data.length} total rows</Badge>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>First Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status Type</TableHead>
                      <TableHead>Cader/Level</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, index) => {
                      const rowErrors = errors.filter(e => e.row === index + 2)
                      return (
                        <TableRow key={index}>
                          <TableCell className={rowErrors.some(e => e.field === 'firstname') ? 'text-red-600' : ''}>
                            {row.firstname}
                          </TableCell>
                          <TableCell className={rowErrors.some(e => e.field === 'email') ? 'text-red-600' : ''}>
                            {row.email}
                          </TableCell>
                          <TableCell className={rowErrors.some(e => e.field === 'statustype') ? 'text-red-600' : ''}>
                            <Badge variant={row.statustype === 'doctor' ? 'default' : 'secondary'}>
                              {row.statustype}
                            </Badge>
                          </TableCell>
                          <TableCell className={rowErrors.some(e => e.field === 'caderlevel') ? 'text-red-600' : ''}>
                            {row.caderlevel}
                          </TableCell>
                          <TableCell className={rowErrors.some(e => e.field === 'phone') ? 'text-red-600' : ''}>
                            {row.phone || '-'}
                          </TableCell>
                          <TableCell>{row.department || '-'}</TableCell>
                          <TableCell>
                            {rowErrors.length > 0 ? (
                              <Badge variant="destructive">Error</Badge>
                            ) : (
                              <Badge variant="default">Valid</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Upload Results */}
          {uploadResult && (
            <Alert className={uploadResult.success ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{uploadResult.message}</p>
                  <div className="text-sm">
                    <span className="text-green-600">✅ Successful: {uploadResult.successfulRecords}</span>
                    {uploadResult.failedRecords > 0 && (
                      <span className="ml-4 text-red-600">❌ Failed: {uploadResult.failedRecords}</span>
                    )}
                  </div>
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="mt-3">
                      <strong className="text-red-700">Errors:</strong>
                      <ul className="list-disc list-inside mt-1 text-sm space-y-1">
                        {uploadResult.errors.slice(0, 5).map((error, index) => (
                          <li key={index} className="text-red-600">
                            Row {error.row}: {error.field ? `${error.field} - ` : ''}{error.message}
                          </li>
                        ))}
                        {uploadResult.errors.length > 5 && (
                          <li className="text-red-600">... and {uploadResult.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
