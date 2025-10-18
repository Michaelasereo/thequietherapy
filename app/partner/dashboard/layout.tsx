'use client';

import type React from "react"
import ErrorBoundary from "@/components/ui/error-boundary"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Calendar, 
  Settings, 
  AlertCircle,
  Clock,
  CheckCircle
} from "lucide-react"

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
    
    fetchPartnerData();
  }, []);

  // Refresh data every 30 seconds to catch approval updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchPartnerData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading]);

  const fetchPartnerData = () => {
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
  };

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

  const isPending = partnerData?.partner?.partner_status === 'pending';
  const isApproved = partnerData?.partner?.partner_status === 'active';

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/partner/dashboard', enabled: true },
    { id: 'members', label: 'Members', icon: Users, href: '/partner/dashboard/members', enabled: isApproved },
    { id: 'credits', label: 'Credits', icon: CreditCard, href: '/partner/dashboard/credits', enabled: isApproved },
    { id: 'sessions', label: 'Sessions', icon: Calendar, href: '/partner/dashboard/sessions', enabled: isApproved },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/partner/dashboard/settings', enabled: isApproved },
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-black border-r border-gray-800 min-h-screen">
            <div className="p-6 border-b border-gray-800">
              <h1 className="text-xl font-semibold text-white">Partner Portal</h1>
              {partnerData && (
                <p className="text-sm text-gray-300 mt-1">
                  {partnerData.partner?.full_name || 'Partner'}
                </p>
              )}
            </div>
            
            <nav className="p-4">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isDisabled = !item.enabled;
                
                return (
                  <Link
                    key={item.id}
                    href={item.enabled ? item.href : '#'}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md mb-2 ${
                      isDisabled 
                        ? 'text-gray-500 cursor-not-allowed' 
                        : 'text-gray-200 hover:bg-gray-800 hover:text-white'
                    }`}
                    onClick={isDisabled ? (e) => e.preventDefault() : undefined}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                    {isDisabled && (
                      <Badge variant="secondary" className="ml-auto text-xs bg-gray-700 text-gray-300">
                        Locked
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Pending Approval Banner */}
            {isPending && (
              <div className="bg-amber-50 border-b border-amber-200 p-4">
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-50 flex items-center justify-center text-xs font-bold mr-3">i</div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-800">
                      Account Pending Approval
                    </h3>
                    <p className="text-sm text-slate-700">
                      Your partnership application is under review. Full access will be available within 24-48 hours.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Approved Banner */}
            {isApproved && (
              <div className="bg-amber-50 border-b border-amber-200 p-4">
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-50 flex items-center justify-center text-xs font-bold mr-3">✓</div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-800">
                      Account Approved
                    </h3>
                    <p className="text-sm text-slate-700">
                      Welcome to the full partner portal! All features are now available.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}


