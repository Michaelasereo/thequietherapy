"use client"

import { useState } from "react"
// Why us features data - Healthcare professional focused
const whyUsFeatures = [
  {
    id: "secure",
    name: "Healthcare-Grade Security",
    icon: "🔒",
    description: "End-to-end encrypted video calls and HIPAA-compliant data protection designed specifically for healthcare professionals",
    details: {
      amount: "256-bit",
      period: "Encryption",
      status: "HIPAA Compliant",
      statusColor: "bg-green-100 text-green-800"
    }
  },
  {
    id: "video",
    name: "Medical-Grade Video",
    icon: "📹",
    description: "High-quality, low-latency video calls optimized for healthcare professional schedules and needs",
    details: {
      amount: "HD Quality",
      period: "Real-time",
      status: "Live",
      statusColor: "bg-blue-100 text-blue-800"
    }
  },
  {
    id: "payment",
    name: "Flexible Healthcare Pricing",
    icon: "💳",
    description: "Flexible payment options designed for medical students and healthcare professionals with transparent pricing",
    details: {
      amount: "Credits",
      period: "Pay-as-you-go",
      status: "Transparent",
      statusColor: "bg-purple-100 text-purple-800"
    }
  },
  {
    id: "different",
    name: "Healthcare-Focused Care",
    icon: "⭐",
    description: "Specialized matching with therapists who understand medical practice, physician wellness, and healthcare professional challenges",
    details: {
      amount: "100%",
      period: "Healthcare-Focused",
      status: "Medical Expert Vetted",
      statusColor: "bg-orange-100 text-orange-800"
    }
  }
]
import { ChevronUp } from "lucide-react"

export default function WhyUs() {
  const [activeTab, setActiveTab] = useState("secure")

  const activeFeature = whyUsFeatures.find(feature => feature.id === activeTab)

  return (
    <section id="about" className="w-full py-16 md:py-24 lg:py-32 bg-white">
      <div className="container px-4 md:px-6">
        {/* Header Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="mb-4">
            <span className="text-sm font-bold uppercase text-black tracking-wide">WHY WE'RE DIFFERENT</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black leading-tight mb-4">
            Secure, specialized, and effective mental health support designed for healthcare professionals so you can focus on what matters most,
            <span className="text-[#A66B24]"> your wellbeing and patient care.</span>
          </h2>
        </div>

        {/* Tabbed Navigation */}
        <div className="flex justify-center mb-12">
          <div className="flex gap-2 p-1 bg-black rounded-lg">
            {whyUsFeatures.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveTab(feature.id)}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === feature.id
                    ? "bg-white text-black shadow-sm"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {feature.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            {/* Large Feature Preview Card */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-12 shadow-sm">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left Side Content */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl shadow-sm">
                      {activeFeature?.icon}
                    </div>
                    <h3 className="text-3xl font-bold text-black">
                      {activeFeature?.name}
                    </h3>
                  </div>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {activeFeature?.description}
                  </p>
                </div>

                {/* Right Side Content - Dashboard Preview */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  {activeTab === "secure" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">Security Status</h4>
                        <span className="px-2 py-1 bg-gray-100 text-black rounded-full text-xs font-medium">Active</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Encryption</span>
                          <span className="font-medium">256-bit AES</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">HIPAA Compliance</span>
                          <span className="font-medium text-black">✓ Verified</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Data Protection</span>
                          <span className="font-medium text-black">✓ Active</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === "video" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">Video Call</h4>
                        <span className="px-2 py-1 bg-gray-100 text-black rounded-full text-xs font-medium">Ready</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Quality</span>
                          <span className="font-medium">HD 1080p</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Latency</span>
                          <span className="font-medium text-black">~50ms</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Connection</span>
                          <span className="font-medium text-black">Stable</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === "payment" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">Credits Balance</h4>
                        <span className="px-2 py-1 bg-gray-100 text-black rounded-full text-xs font-medium">15 Credits</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Session Cost</span>
                          <span className="font-medium">1 Credit</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Next Session</span>
                          <span className="font-medium text-black">Tomorrow 2:00 PM</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Auto-refill</span>
                          <span className="font-medium text-black">Enabled</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === "different" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">About Our CEO</h4>
                        <span className="px-2 py-1 bg-gray-100 text-black rounded-full text-xs font-medium">Leadership</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">CEO</span>
                          <span className="font-medium">Dr. Asere Opeyemi-Michael</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Company</span>
                          <span className="font-medium">TheQuietbrand</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Passion</span>
                          <span className="font-medium text-black">Healthcare Excellence</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scroll Button */}
            <button className="absolute -bottom-6 right-8 w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
              <ChevronUp className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
