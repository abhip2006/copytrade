import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-2xl bg-gradient-to-r from-[#00FFF010] via-[#7C3AED10] to-[#00FFF010] bg-[length:200%_100%] animate-[shimmer_2s_infinite]", className)}
      style={{
        animation: 'shimmer 2s infinite',
      }}
      {...props}
    />
  )
}

export { Skeleton }
