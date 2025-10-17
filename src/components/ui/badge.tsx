import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-[#00FFF0] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[#00FFF020] text-[#00FFF0] border-[#00FFF040] shadow-[0_0_10px_rgba(0,255,240,0.2)] hover:bg-[#00FFF030] hover:shadow-[0_0_20px_rgba(0,255,240,0.4)]",
        primary:
          "bg-[#00FFF020] text-[#00FFF0] border-[#00FFF040] shadow-[0_0_10px_rgba(0,255,240,0.2)] hover:bg-[#00FFF030] hover:shadow-[0_0_20px_rgba(0,255,240,0.4)]",
        secondary:
          "bg-[#7C3AED20] text-[#A78BFA] border-[#7C3AED40] shadow-[0_0_10px_rgba(124,58,237,0.2)] hover:bg-[#7C3AED30] hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]",
        destructive:
          "bg-[#FF336620] text-[#FF3366] border-[#FF336640] shadow-[0_0_10px_rgba(255,51,102,0.2)] hover:bg-[#FF336630] hover:shadow-[0_0_20px_rgba(255,51,102,0.4)]",
        danger:
          "bg-[#FF336620] text-[#FF3366] border-[#FF336640] shadow-[0_0_10px_rgba(255,51,102,0.2)] hover:bg-[#FF336630] hover:shadow-[0_0_20px_rgba(255,51,102,0.4)]",
        success:
          "bg-[#00FF8820] text-[#00FF88] border-[#00FF8840] shadow-[0_0_10px_rgba(0,255,136,0.2)] hover:bg-[#00FF8830] hover:shadow-[0_0_20px_rgba(0,255,136,0.4)]",
        warning:
          "bg-[#FFD70020] text-[#FFD700] border-[#FFD70040] shadow-[0_0_10px_rgba(255,215,0,0.2)] hover:bg-[#FFD70030] hover:shadow-[0_0_20px_rgba(255,215,0,0.4)]",
        outline: "text-white border-[#00FFF030] hover:bg-[#00FFF010]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
