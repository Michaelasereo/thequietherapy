/**
 * CSV Validation Service for TRPI Partner Bulk Upload
 * Provides comprehensive validation for CSV data before processing
 */

export interface CSVRow {
  name: string
  email: string
  phone?: string
  department?: string
  position?: string
  credits?: string | number
  package?: string
}

export interface ValidationError {
  row: number
  field?: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  totalRows: number
  validRows: number
}

export class CSVValidator {
  private static readonly REQUIRED_HEADERS = ['name', 'email']
  private static readonly OPTIONAL_HEADERS = ['phone', 'department', 'position', 'credits', 'package']
  private static readonly ALL_HEADERS = [...CSVValidator.REQUIRED_HEADERS, ...CSVValidator.OPTIONAL_HEADERS]
  
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  private static readonly PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/
  
  private static readonly VALID_PACKAGES = ['basic', 'standard', 'professional', 'enterprise']
  private static readonly MAX_CREDITS = 1000
  private static readonly MIN_CREDITS = 1

  /**
   * Validate CSV headers
   */
  static validateHeaders(headers: string[]): ValidationError[] {
    const errors: ValidationError[] = []
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim())
    
    // Check for required headers
    const missingHeaders = CSVValidator.REQUIRED_HEADERS.filter(
      required => !normalizedHeaders.includes(required)
    )
    
    if (missingHeaders.length > 0) {
      errors.push({
        row: 1,
        message: `Missing required headers: ${missingHeaders.join(', ')}`,
        severity: 'error'
      })
    }
    
    // Check for unknown headers
    const unknownHeaders = normalizedHeaders.filter(
      header => !CSVValidator.ALL_HEADERS.includes(header)
    )
    
    if (unknownHeaders.length > 0) {
      errors.push({
        row: 1,
        message: `Unknown headers will be ignored: ${unknownHeaders.join(', ')}`,
        severity: 'warning'
      })
    }
    
    return errors
  }

  /**
   * Validate a single CSV row
   */
  static validateRow(row: CSVRow, rowNumber: number): ValidationError[] {
    const errors: ValidationError[] = []
    
    // Validate required fields
    if (!row.name || row.name.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'name',
        message: 'Name is required and cannot be empty',
        severity: 'error'
      })
    } else if (row.name.length > 255) {
      errors.push({
        row: rowNumber,
        field: 'name',
        message: 'Name must be less than 255 characters',
        severity: 'error'
      })
    }

    if (!row.email || row.email.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'email',
        message: 'Email is required and cannot be empty',
        severity: 'error'
      })
    } else if (!CSVValidator.EMAIL_REGEX.test(row.email.trim())) {
      errors.push({
        row: rowNumber,
        field: 'email',
        message: 'Invalid email format',
        severity: 'error'
      })
    } else if (row.email.length > 255) {
      errors.push({
        row: rowNumber,
        field: 'email',
        message: 'Email must be less than 255 characters',
        severity: 'error'
      })
    }

    // Validate optional fields
    if (row.phone && row.phone.trim() !== '') {
      const cleanPhone = row.phone.replace(/\s/g, '')
      if (!CSVValidator.PHONE_REGEX.test(cleanPhone)) {
        errors.push({
          row: rowNumber,
          field: 'phone',
          message: 'Invalid phone format. Use international format (e.g., +1234567890)',
          severity: 'error'
        })
      }
    }

    if (row.department && row.department.length > 100) {
      errors.push({
        row: rowNumber,
        field: 'department',
        message: 'Department must be less than 100 characters',
        severity: 'error'
      })
    }

    if (row.position && row.position.length > 100) {
      errors.push({
        row: rowNumber,
        field: 'position',
        message: 'Position must be less than 100 characters',
        severity: 'error'
      })
    }

    // Validate credits
    if (row.credits !== undefined && row.credits !== '') {
      const creditsValue = typeof row.credits === 'string' ? parseInt(row.credits, 10) : row.credits
      
      if (isNaN(creditsValue)) {
        errors.push({
          row: rowNumber,
          field: 'credits',
          message: 'Credits must be a valid number',
          severity: 'error'
        })
      } else if (creditsValue < CSVValidator.MIN_CREDITS) {
        errors.push({
          row: rowNumber,
          field: 'credits',
          message: `Credits must be at least ${CSVValidator.MIN_CREDITS}`,
          severity: 'error'
        })
      } else if (creditsValue > CSVValidator.MAX_CREDITS) {
        errors.push({
          row: rowNumber,
          field: 'credits',
          message: `Credits cannot exceed ${CSVValidator.MAX_CREDITS}`,
          severity: 'error'
        })
      }
    }

    // Validate package
    if (row.package && row.package.trim() !== '') {
      const packageLower = row.package.toLowerCase().trim()
      if (!CSVValidator.VALID_PACKAGES.includes(packageLower)) {
        errors.push({
          row: rowNumber,
          field: 'package',
          message: `Invalid package. Valid options: ${CSVValidator.VALID_PACKAGES.join(', ')}`,
          severity: 'warning'
        })
      }
    }

    return errors
  }

  /**
   * Validate entire CSV data
   */
  static validateCSVData(data: CSVRow[]): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    let validRows = 0

    // Check for empty data
    if (!data || data.length === 0) {
      errors.push({
        row: 0,
        message: 'CSV file is empty or contains no valid data',
        severity: 'error'
      })
      
      return {
        isValid: false,
        errors,
        warnings,
        totalRows: 0,
        validRows: 0
      }
    }

    // Check for duplicate emails
    const emailMap = new Map<string, number[]>()
    
    data.forEach((row, index) => {
      if (row.email) {
        const email = row.email.toLowerCase().trim()
        if (!emailMap.has(email)) {
          emailMap.set(email, [])
        }
        emailMap.get(email)!.push(index + 2) // +2 for header row and 0-based index
      }
    })

    // Report duplicates
    emailMap.forEach((rows, email) => {
      if (rows.length > 1) {
        errors.push({
          row: rows[0],
          field: 'email',
          message: `Duplicate email '${email}' found in rows: ${rows.join(', ')}`,
          severity: 'error'
        })
      }
    })

    // Validate each row
    data.forEach((row, index) => {
      const rowNumber = index + 2 // +2 for header row and 0-based index
      const rowErrors = CSVValidator.validateRow(row, rowNumber)
      
      const rowErrorsOnly = rowErrors.filter(e => e.severity === 'error')
      const rowWarningsOnly = rowErrors.filter(e => e.severity === 'warning')
      
      errors.push(...rowErrorsOnly)
      warnings.push(...rowWarningsOnly)
      
      if (rowErrorsOnly.length === 0) {
        validRows++
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalRows: data.length,
      validRows
    }
  }

  /**
   * Parse CSV text into structured data
   */
  static parseCSV(csvText: string): { headers: string[], data: CSVRow[] } {
    const lines = csvText.trim().split('\n')
    
    if (lines.length < 1) {
      throw new Error('CSV must have at least a header row')
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const data: CSVRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = CSVValidator.parseCSVLine(lines[i])
      const row: any = {}
      
      headers.forEach((header, index) => {
        if (CSVValidator.ALL_HEADERS.includes(header)) {
          row[header] = values[index] ? values[index].trim() : ''
        }
      })
      
      // Skip empty rows
      if (Object.values(row).some(value => value !== '')) {
        data.push(row as CSVRow)
      }
    }

    return { headers, data }
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current)
    return result
  }

  /**
   * Generate validation summary report
   */
  static generateValidationReport(result: ValidationResult): string {
    const lines: string[] = []
    
    lines.push('=== CSV Validation Report ===')
    lines.push(`Total rows: ${result.totalRows}`)
    lines.push(`Valid rows: ${result.validRows}`)
    lines.push(`Invalid rows: ${result.totalRows - result.validRows}`)
    lines.push(`Errors: ${result.errors.length}`)
    lines.push(`Warnings: ${result.warnings.length}`)
    lines.push('')
    
    if (result.errors.length > 0) {
      lines.push('ERRORS:')
      result.errors.forEach(error => {
        lines.push(`  Row ${error.row}: ${error.field ? `[${error.field}] ` : ''}${error.message}`)
      })
      lines.push('')
    }
    
    if (result.warnings.length > 0) {
      lines.push('WARNINGS:')
      result.warnings.forEach(warning => {
        lines.push(`  Row ${warning.row}: ${warning.field ? `[${warning.field}] ` : ''}${warning.message}`)
      })
    }
    
    return lines.join('\n')
  }

  /**
   * Get sample CSV template
   */
  static getCSVTemplate(): string {
    return `name,email,phone,department,position,credits,package
John Doe,john@company.com,+1234567890,Engineering,Software Engineer,10,standard
Jane Smith,jane@company.com,+1987654321,Marketing,Marketing Manager,15,professional
Bob Wilson,bob@company.com,,Sales,Sales Rep,8,basic
Alice Brown,alice@company.com,+1555123456,HR,HR Coordinator,12,standard`
  }

  /**
   * Estimate processing time based on data size
   */
  static estimateProcessingTime(rowCount: number): string {
    if (rowCount <= 10) return 'Less than 1 minute'
    if (rowCount <= 100) return '1-2 minutes'
    if (rowCount <= 500) return '2-5 minutes'
    if (rowCount <= 1000) return '5-10 minutes'
    return 'More than 10 minutes'
  }
}

/**
 * Utility functions for CSV processing
 */
export class CSVUtils {
  /**
   * Convert array of objects to CSV string
   */
  static arrayToCSV(data: any[], headers?: string[]): string {
    if (!data || data.length === 0) return ''
    
    const csvHeaders = headers || Object.keys(data[0])
    const csvRows = [
      csvHeaders.join(','),
      ...data.map(row => 
        csvHeaders.map(header => {
          const value = row[header] || ''
          // Escape commas and quotes
          return value.toString().includes(',') || value.toString().includes('"') 
            ? `"${value.toString().replace(/"/g, '""')}"` 
            : value
        }).join(',')
      )
    ]
    
    return csvRows.join('\n')
  }

  /**
   * Download CSV file
   */
  static downloadCSV(data: string, filename: string): void {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}
