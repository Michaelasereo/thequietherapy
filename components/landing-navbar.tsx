"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { navLinks } from "@/lib/data"
import { Logo } from "@/components/ui/logo"

export default function LandingNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Top Banner */}
      <div className="bg-black text-white px-4 py-2 text-center text-sm font-medium">
        <div className="container flex items-center justify-center gap-2">
          <span>🎉 Magic Link Authentication - No Passwords Needed!</span>
          <span>→</span>
        </div>
      </div>
      
      {/* Floating Navbar */}
      <div className="container px-4 md:px-6 py-4">
        <nav className="bg-white border border-gray-200 rounded-2xl shadow-lg backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Logo size="sm" variant="dark" />
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="hidden md:inline-flex text-gray-600 hover:text-black hover:bg-gray-50 rounded-xl">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button asChild className="bg-black text-white hover:bg-gray-800 rounded-xl border border-white">
            <Link href="/book-session">Book a Session</Link>
          </Button>
          <Button asChild variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl">
            <Link href="/test-login">Test Dashboards</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden bg-transparent">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 py-6">
                {navLinks.map((link) => (
                  <Link key={link.name} href={link.href} className="text-lg font-semibold">
                    {link.name}
                  </Link>
                ))}
                <Link href="/signup" className="text-lg font-semibold">
                  Get Started
                </Link>
                <Link href="/book-session" className="text-lg font-semibold">
                  Book a Session
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
          </div>
        </nav>
      </div>
    </header>
  )
}
