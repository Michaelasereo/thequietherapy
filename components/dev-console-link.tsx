'use client'

import { useState } from 'react'

export default function DevConsoleLink() {
  const [show, setShow] = useState(false)

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <>
      {/* Floating Dev Button */}
      <div className="fixed bottom-4 right-4 z-50">
        {!show ? (
          <button
            onClick={() => setShow(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-sm flex items-center gap-2"
            title="Open Developer Console"
          >
            🛠️ Dev Console
          </button>
        ) : (
          <div className="bg-white rounded-lg shadow-2xl border-2 border-purple-600 p-4 w-80">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-gray-900">🛠️ Developer Tools</h3>
              <button
                onClick={() => setShow(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              <a
                href="/dev-console"
                target="_blank"
                className="block w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors text-center font-medium"
              >
                🚀 Open Dev Console
              </a>

              <div className="bg-gray-50 p-3 rounded-lg text-xs">
                <p className="font-medium text-gray-700 mb-2">Quick Actions:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• Create test sessions</li>
                  <li>• Generate transcripts</li>
                  <li>• View SOAP notes</li>
                  <li>• Test video flow</li>
                </ul>
              </div>

              <p className="text-xs text-gray-500 text-center pt-2">
                Development mode only
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

