import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Payment System Test",
  description: "Test your Paystack integration and payment flow",
}

export default function TestPaymentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
