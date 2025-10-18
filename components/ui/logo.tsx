"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "auto" | "light" | "dark"
}

export function Logo({ className, size = "md", variant = "auto" }: LogoProps) {
  const sizeClasses = {
    sm: "h-10 w-auto",
    md: "h-12 w-auto", 
    lg: "h-20 w-auto"
  }

  const getLogoSrc = () => {
    // Add version parameter to force reload of new logo
    const version = "v3"
    if (variant === "light") {
      return `/logo-quietherapy-white-version.png?v=${version}`
    } else if (variant === "dark") {
      return `/logo-quietherapy-black-version.png?v=${version}`
    } else {
      // Auto variant - default to dark logo for light backgrounds
      return `/logo-quietherapy-black-version.png?v=${version}`
    }
  }

  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={getLogoSrc()}
        alt="Quiet Logo"
        style={{ height: size === "sm" ? "40px" : size === "md" ? "48px" : "80px", width: "auto" }}
        onError={(e) => {
          console.error('Logo failed to load:', getLogoSrc());
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  )
}
