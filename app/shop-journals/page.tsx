"use client"

import Script from 'next/script'
import { useEffect } from 'react'
import LandingNavbar from '@/components/landing-navbar'

export default function ShopJournalsPage() {
  useEffect(() => {
    // Ensure Ecwid initializes even if scripts load in different order
    const checkAndInit = () => {
      if (typeof window !== 'undefined' && (window as any).xProductBrowser) {
        try {
          (window as any).xProductBrowser(
            "categoriesPerRow=3",
            "views=grid(20,3) list(60) table(60)",
            "categoryView=grid",
            "searchView=list",
            "id=my-store-80118766"
          );
        } catch (e) {
          console.log('Ecwid init:', e);
        }
      }
    };
    
    checkAndInit();
    
    // Also try after a short delay in case script loads late
    const timeout = setTimeout(checkAndInit, 1000);
    
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <LandingNavbar />
        
        <div className="container mx-auto px-4 py-12">
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Shop Journals</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our collection of therapeutic journals and wellness resources designed to support your mental health journey
            </p>
          </div>
          
          {/* Ecwid Store Container */}
          <div id="my-store-80118766"></div>
        </div>
      </div>
      
      {/* Ecwid Embed Scripts */}
      <Script 
        id="ecwid-main" 
        strategy="lazyOnload"
        data-cfasync="false" 
        type="text/javascript"
        src="https://app.ecwid.com/script.js?80118766&data_platform=code&data_date=2025-10-31" 
        charSet="utf-8"
      />
    </>
  )
}

