import { cn } from "@/lib/utils"

interface BookingProgressProps {
  currentStep: number
  totalSteps: number
  labels: string[]
}

export default function BookingProgress({ currentStep, totalSteps, labels }: BookingProgressProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-6 px-4 md:px-6 border-b">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full font-bold",
              currentStep === index + 1
                ? "bg-primary text-primary-foreground"
                : currentStep > index + 1
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {index + 1}
          </div>
          <span
            className={cn(
              "hidden sm:block text-sm font-medium",
              currentStep === index + 1 ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {labels[index]}
          </span>
          {index < totalSteps - 1 && (
            <div className={cn("h-0.5 w-8 rounded-full", currentStep > index + 1 ? "bg-primary" : "bg-muted")} />
          )}
        </div>
      ))}
    </div>
  )
}
