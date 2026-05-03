import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

type CheckboxProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  checked?: boolean
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked = false, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="checkbox"
      aria-checked={checked}
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded border border-primary ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary text-primary-foreground" : "bg-background",
        className,
      )}
      {...props}
    >
      {checked ? <Check className="h-3.5 w-3.5" /> : null}
    </button>
  ),
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
