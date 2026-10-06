import { cn } from "cn"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-shimmer rounded-md bg-[linear-gradient(90deg,#DDECEA_0%,#E9F2F0_50%,#DDECEA_100%)] bg-size-[200%_100%]", className)}
      {...props}
    />
  )
}

export { Skeleton }
