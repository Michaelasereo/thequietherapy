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
    sm: "h-8 w-auto",
    md: "h-10 w-auto", 
    lg: "h-16 w-auto"
  }

  const getLogoSrc = () => {
    if (variant === "light") {
      return "/quiet-logo-whitee.png"
    } else if (variant === "dark") {
      return "/quiet-logo-blackk.png"
    } else {
      // Auto variant - default to dark logo for light backgrounds
      return "/quiet-logo-blackk.png"
    }
  }

  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={getLogoSrc()}
        alt="Quiet Logo"
        style={{ height: size === "sm" ? "32px" : size === "md" ? "40px" : "64px", width: "auto" }}
        onError={(e) => {
          console.error('Logo failed to load:', getLogoSrc());
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  )
}
