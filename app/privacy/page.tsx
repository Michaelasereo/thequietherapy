"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            <p className="text-sm text-gray-500 mt-2">Last updated: November 2024</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                <p className="text-gray-700">
                  Welcome to The Quiet Therapy. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Personal Information</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Name, email address, and phone number</li>
                      <li>Professional qualifications and licenses</li>
                      <li>Profile information and preferences</li>
                      <li>Payment and billing information</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Session Information</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Session recordings and transcripts</li>
                      <li>Session notes and documentation</li>
                      <li>Client interaction data</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Technical Information</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>IP address and device information</li>
                      <li>Browser type and version</li>
                      <li>Usage data and analytics</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>To provide and improve our therapy services</li>
                  <li>To process payments and manage your account</li>
                  <li>To send you important notifications and updates</li>
                  <li>To ensure compliance with professional and legal standards</li>
                  <li>To analyze and improve our platform functionality</li>
                  <li>To protect against fraud and unauthorized access</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
                <p className="text-gray-700">
                  We implement industry-standard security measures to protect your information, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mt-3">
                  <li>Encrypted data transmission (SSL/TLS)</li>
                  <li>Secure database storage</li>
                  <li>Access controls and authentication</li>
                  <li>Regular security audits and updates</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. HIPAA Compliance</h2>
                <p className="text-gray-700">
                  As a healthcare platform, we comply with the Health Insurance Portability and Accountability Act (HIPAA). All Protected Health Information (PHI) is handled in accordance with HIPAA requirements, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mt-3">
                  <li>Business Associate Agreements with all service providers</li>
                  <li>Encrypted storage and transmission of PHI</li>
                  <li>Access logging and audit trails</li>
                  <li>Regular compliance reviews</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Information Sharing</h2>
                <p className="text-gray-700">
                  We do not sell your personal information. We may share your information only in the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mt-3">
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect rights and prevent harm</li>
                  <li>With trusted service providers who assist in platform operations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
                <p className="text-gray-700 mb-3">You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your information</li>
                  <li>Opt-out of certain communications</li>
                  <li>Request a copy of your data</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking</h2>
                <p className="text-gray-700">
                  We use cookies and similar technologies to enhance your experience, analyze usage, and support platform functionality. You can manage cookie preferences through your browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
                <p className="text-gray-700">
                  Our platform is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
                <p className="text-gray-700">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
                <p className="text-gray-700">
                  If you have questions about this Privacy Policy or our data practices, please contact us at:
                </p>
                <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                  <p className="font-semibold">The Quiet Therapy</p>
                  <p>Email: support@thequietherapy.live</p>
                  <p>Website: <Link href="/support" className="text-blue-600 hover:underline">thequietherapy.live/support</Link></p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

