import type React from "react"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { navLinks } from "@/lib/data"

export default function Footer() {
  return (
    <footer className="w-full py-16 md:py-20 lg:py-24 bg-black text-white">
      <div className="container grid gap-8 px-4 md:px-6 md:grid-cols-3 lg:grid-cols-4">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl">
            <Logo size="md" variant="light" />
          </Link>
          <p className="text-gray-300 leading-relaxed">Your trusted partner for mental well-being.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-gray-400 hover:text-gray-50 transition-colors">
              <FacebookIcon className="h-6 w-6" />
              <span className="sr-only">Facebook</span>
            </Link>
            <Link href="#" className="text-gray-400 hover:text-gray-50 transition-colors">
              <TwitterIcon className="h-6 w-6" />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link href="#" className="text-gray-400 hover:text-gray-50 transition-colors">
              <InstagramIcon className="h-6 w-6" />
              <span className="sr-only">Instagram</span>
            </Link>
            <Link href="#" className="text-gray-400 hover:text-gray-50 transition-colors">
              <LinkedinIcon className="h-6 w-6" />
              <span className="sr-only">LinkedIn</span>
            </Link>
          </div>
        </div>
        <div className="grid gap-4">
          <h3 className="text-lg font-semibold text-white">Quick Links</h3>
          <ul className="space-y-3">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link href={link.href} className="text-gray-300 hover:text-white transition-colors">
                  {link.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
                Login
              </Link>
            </li>
            <li>
              <Link href="/register" className="text-gray-300 hover:text-white transition-colors">
                Register
              </Link>
            </li>
          </ul>
        </div>
        <div className="grid gap-4">
          <h3 className="text-lg font-semibold text-white">Contact Us</h3>
          <ul className="space-y-3 text-gray-300">
            <li>123 Therapy Lane, Wellness City, 90210</li>
            <li>Email: info@quiet.com</li>
            <li>Phone: (123) 456-7890</li>
          </ul>
        </div>
        <div className="grid gap-4">
          <h3 className="text-lg font-semibold text-white">Legal</h3>
          <ul className="space-y-3">
            <li>
              <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                Disclaimer
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="container mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Quiet. All rights reserved.
      </div>
    </footer>
  )
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.5" y1="6.5" y2="6.5" />
    </svg>
  )
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  )
}
