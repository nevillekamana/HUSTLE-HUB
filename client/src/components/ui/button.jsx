import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority";
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border-2 border-transparent bg-clip-padding text-sm font-bold whitespace-nowrap transition-[transform,box-shadow,background-color] duration-100 select-none disabled:pointer-events-none disabled:opacity-60 disabled:shadow-none aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground shadow-hard-ink hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-hard-sm active:translate-x-1 active:translate-y-1 active:shadow-none",
        outline:
          "border-primary bg-card text-primary hover:bg-tint aria-expanded:bg-tint",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-aqua aria-expanded:bg-aqua",
        ghost:
          "text-primary hover:bg-tint aria-expanded:bg-tint",
        destructive:
          "border-destructive bg-card text-destructive hover:bg-danger-tint",
        danger:
          "border-destructive bg-destructive text-white hover:border-[#8F1E17] hover:bg-[#8F1E17]",
        link: "px-0! text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-7 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3.5 text-[13px] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 text-base has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-11",
        "icon-xs":
          "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
