export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <div className="mb-4">
          <div className="mx-auto h-12 w-12 text-yellow-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          System Maintenance
        </h1>
        <p className="text-gray-600 mb-4">
          We're currently performing maintenance on our authentication system. 
          Please try again in a few minutes.
        </p>
        <div className="text-sm text-gray-500">
          If this issue persists, please contact support.
        </div>
      </div>
    </div>
  )
}
