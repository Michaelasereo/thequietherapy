import type React from "react"
import type { Metadata, Viewport } from "next/types"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { GlobalStateProvider } from "@/context/global-state-context"
import { AuthProvider } from "@/context/auth-context"
import { Toaster } from "@/components/ui/toaster"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mental Health Platform for Doctors & Medical Students | Quiet - Professional Therapy Services",
  description: "Professional mental health support platform designed for healthcare professionals and medical students. Access licensed therapists, psychiatrist consultations, medical student counseling, and physician wellness programs. HIPAA-compliant, evidence-based therapy for healthcare workers.",
  keywords: [
    "mental health for doctors",
    "therapy for medical students",
    "physician mental health",
    "healthcare professional counseling",
    "medical student therapy",
    "doctor burnout therapy",
    "resident physician counseling",
    "healthcare worker mental health",
    "medical professional therapy",
    "physician wellness program",
    "medical student mental health",
    "healthcare provider counseling",
    "doctor stress management",
    "medical resident therapy",
    "healthcare professional support",
    "physician anxiety therapy",
    "medical student depression",
    "healthcare worker counseling",
    "doctor mental wellness",
    "medical professional support",
    "healthcare provider therapy",
    "physician counseling services",
    "medical student support group",
    "healthcare professional burnout",
    "doctor mental health resources"
  ],
  authors: [{ name: "Quiet Therapy Platform" }],
  creator: "Quiet",
  publisher: "Quiet",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://quiet-therapy.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Mental Health Platform for Doctors & Medical Students | Quiet",
    description: "Professional mental health support for healthcare professionals and medical students. Licensed therapists, physician wellness programs, and medical student counseling.",
    url: 'https://quiet-app.com',
    siteName: 'Quiet - Healthcare Mental Health Platform',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Quiet - Mental Health Platform for Doctors and Medical Students',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Mental Health Platform for Doctors & Medical Students | Quiet",
    description: "Professional mental health support for healthcare professionals and medical students. Licensed therapists, physician wellness programs, and medical student counseling.",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  generator: 'Next.js',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Quiet Therapy'
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }
    ]
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Quiet Therapy" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalBusiness",
              "name": "Quiet - Healthcare Mental Health Platform",
              "description": "Professional mental health support platform designed specifically for healthcare professionals and medical students. Providing licensed therapists, physician wellness programs, and medical student counseling services.",
              "url": "https://quiet-app.com",
              "logo": "https://quiet-app.com/logo-quietherapy-black-version.png",
              "image": "https://quiet-app.com/og-image.jpg",
              "telephone": "+234-800-QUIET-01",
              "email": "support@quiet-app.com",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "NG"
              },
              "serviceArea": {
                "@type": "Country",
                "name": "Nigeria"
              },
              "medicalSpecialty": [
                "Psychiatry",
                "Psychology", 
                "Mental Health Counseling",
                "Physician Wellness",
                "Medical Student Counseling",
                "Healthcare Professional Therapy",
                "Doctor Burnout Treatment",
                "Medical Resident Support",
                "Cognitive Behavioral Therapy",
                "Anxiety Treatment",
                "Depression Treatment"
              ],
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Healthcare Professional Mental Health Services",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Doctor Mental Health Counseling",
                      "description": "Specialized therapy sessions for physicians and healthcare professionals dealing with stress, burnout, and mental health challenges"
                    }
                  },
                  {
                    "@type": "Offer", 
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Medical Student Therapy",
                      "description": "Professional counseling and support services for medical students facing academic stress, anxiety, and depression"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service", 
                      "name": "Physician Wellness Programs",
                      "description": "Comprehensive wellness programs designed to support physician mental health and prevent burnout"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service", 
                      "name": "Healthcare Worker Counseling",
                      "description": "Mental health support for nurses, technicians, and other healthcare workers"
                    }
                  }
                ]
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "850"
              },
              "sameAs": [
                "https://www.facebook.com/quiethealthcare",
                "https://www.twitter.com/quiethealthcare",
                "https://www.linkedin.com/company/quiet-healthcare"
              ]
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <GlobalStateProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </GlobalStateProvider>
        </ThemeProvider>
        <Script
          id="service-worker"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
