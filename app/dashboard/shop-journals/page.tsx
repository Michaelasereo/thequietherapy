"use client"

import Script from 'next/script'
import { useEffect } from 'react'

export default function DashboardShopJournalsPage() {
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
      <div className="space-y-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shop Journals</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Explore our collection of therapeutic journals and wellness resources designed to support your mental health journey
          </p>
        </div>
        
        {/* Ecwid Store Container */}
        <div id="my-store-80118766"></div>
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

