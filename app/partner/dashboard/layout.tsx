'use client';

import type React from "react"
import ErrorBoundary from "@/components/ui/error-boundary"
import { useEffect, useState } from "react"

export default function PartnerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('🚀 PARTNER DASHBOARD LAYOUT STARTED');
  console.log('🔍 Minimal partner dashboard layout rendering...');
  
  const [partnerData, setPartnerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 Dashboard layout useEffect - fetching partner data...');
    console.log('🍪 Checking for cookies...');
    
    // Log all cookies for debugging
    const allCookies = document.cookie;
    console.log('🍪 All cookies:', allCookies);
    
    fetch('/api/partner/me', {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    .then(res => {
      console.log('📡 Partner me response status:', res.status);
      console.log('📡 Partner me response headers:', res.headers);
      return res.json();
    })
    .then(data => {
      console.log('📡 Partner me response data:', data);
      setPartnerData(data);
      setLoading(false);
      console.log('✅ Partner data loaded successfully');
    })
    .catch(err => {
      console.error('❌ Error fetching partner data:', err);
      setError(err.message);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading partner dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Failed to load dashboard</h2>
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white">
        <header className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-xl font-semibold">Partner Dashboard</h1>
          {partnerData && (
            <p className="text-sm text-gray-600 mt-1">
              Welcome, {partnerData.partner?.full_name || 'Partner'}
            </p>
          )}
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </ErrorBoundary>
  );
}


