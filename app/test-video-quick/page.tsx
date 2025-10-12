"use client"

import { VideoTestConsole } from "@/components/video-test-console"
import { Card } from "@/components/ui/card"

export default function QuickVideoTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h1 className="text-2xl font-bold mb-2">🎥 Quick Video Test Page</h1>
          <p className="text-gray-700">
            Standalone test page - no dashboard required!
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Use this if the dashboard is slow or cached.
          </p>
        </Card>

        <VideoTestConsole />
      </div>
    </div>
  )
}

