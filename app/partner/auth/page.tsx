"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, ArrowLeft, ArrowRight } from "lucide-react"
import { Logo } from "@/components/ui/logo"

export default function PartnerAuthPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Section - Black Background with Partner Features */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <Logo size="sm" variant="light" />
            </Link>
          </div>

          {/* Partner Features */}
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-4 w-full max-w-sm">
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-4">Partner Portal</h2>
                <p className="text-gray-300 mb-6">
                  Manage your organization's therapy services with our comprehensive partner dashboard.
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Bulk member management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Credit tracking and assignment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Session analytics and reporting</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Payment and billing management</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-white/60 text-sm">
            <p>Trusted by 500+ organizations worldwide</p>
          </div>
        </div>
      </div>

      {/* Right Section - Auth Options */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Partner Portal</h1>
            </div>
            <p className="text-muted-foreground">
              Access your organization's therapy management dashboard
            </p>
          </div>

          {/* Auth Options */}
          <div className="space-y-4">
            <Link href="/partner/login" className="block">
              <Button className="w-full h-12">
                Login to Partner Portal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            
            <Link href="/partner/onboarding" className="block">
              <Button variant="outline" className="w-full h-12">
                Become a Partner
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Footer Links */}
          <div className="text-center space-y-4">
            <div className="flex justify-center space-x-4 text-sm">
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                Individual Login
              </Link>
              <Link href="/therapist/login" className="text-muted-foreground hover:text-foreground">
                Therapist Login
              </Link>
            </div>
            
            <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}