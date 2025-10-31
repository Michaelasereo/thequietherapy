'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface SOAPNotesDisplayProps {
  soapNotes: any // Can be string, object, or parsed JSON
  className?: string
  showToggle?: boolean
  variant?: 'default' | 'card'
}

export default function SOAPNotesDisplay({ 
  soapNotes, 
  className = '',
  showToggle = true,
  variant = 'default'
}: SOAPNotesDisplayProps) {
  const [showRaw, setShowRaw] = useState(false)

  if (!soapNotes) return null

  // Parse if string, otherwise use as-is
  let parsedNotes: any = null
  if (typeof soapNotes === 'string') {
    try {
      parsedNotes = JSON.parse(soapNotes)
    } catch {
      // If not JSON, treat as plain string
      if (variant === 'card') {
        return (
          <div className={`bg-green-50 p-4 rounded-lg border border-green-200 ${className}`}>
            <pre className="text-sm whitespace-pre-wrap font-mono">{soapNotes}</pre>
          </div>
        )
      }
      return (
        <div className={className}>
          <pre className="text-sm whitespace-pre-wrap font-mono">{soapNotes}</pre>
        </div>
      )
    }
  } else if (typeof soapNotes === 'object') {
    parsedNotes = soapNotes
  }

  // Raw JSON text for when toggle is on
  const rawText = typeof soapNotes === 'string' ? soapNotes : JSON.stringify(soapNotes, null, 2)

  // Pretty view content
  const prettyContent = parsedNotes ? (
    <div className="space-y-6">
      {(['subjective', 'objective', 'assessment', 'plan'] as const).map((section) => (
        <div key={section}>
          <h4 className="font-semibold text-gray-900 uppercase tracking-wide text-xs mb-2">
            {section}
          </h4>
          {renderSection(parsedNotes[section])}
        </div>
      ))}
    </div>
  ) : null

  // Determine what to show
  const showPretty = parsedNotes && !showRaw
  const content = showPretty ? prettyContent : (
    <pre className="text-sm whitespace-pre-wrap font-mono">{rawText}</pre>
  )

  if (variant === 'card') {
    return (
      <div className={`bg-green-50 p-4 rounded-lg border border-green-200 ${className}`}>
        {showToggle && (
          <div className="flex items-center justify-end mb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRaw(!showRaw)}
            >
              {showRaw ? 'Show Pretty View' : 'Show Raw JSON'}
            </Button>
          </div>
        )}
        {content}
      </div>
    )
  }

  return (
    <div className={className}>
      {showToggle && (
        <div className="flex items-center justify-end mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowRaw(!showRaw)}
          >
            {showRaw ? 'Show Pretty View' : 'Show Raw JSON'}
          </Button>
        </div>
      )}
      {content}
    </div>
  )
}

function renderSection(value: any) {
  if (!value) {
    return <p className="text-sm text-gray-600">N/A</p>
  }
  
  if (typeof value === 'string') {
    return <p className="text-sm text-gray-800 whitespace-pre-wrap">{value}</p>
  }
  
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
        {value.map((item, idx) => (
          <li key={idx}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
        ))}
      </ul>
    )
  }
  
  if (typeof value === 'object') {
    const entries = Object.entries(value)
    return (
      <div className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k} className="border-l-2 border-green-200 pl-3 py-1">
            <div className="text-xs font-medium text-gray-500 mb-1">{humanize(k)}</div>
            <div className="text-sm text-gray-800">{typeof v === 'string' ? v : JSON.stringify(v)}</div>
          </div>
        ))}
      </div>
    )
  }
  
  return <p className="text-sm text-gray-800">{String(value)}</p>
}

function humanize(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase())
}

