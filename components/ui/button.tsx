import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-ink text-white hover:bg-ink/90",
    outline: "border border-black/10 bg-white hover:bg-black/5",
    ghost: "hover:bg-black/5"
  };
  return (
    <button
      ref={ref}
      className={cn("focus-ring inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium disabled:pointer-events-none disabled:opacity-50", variants[variant], className)}
      {...props}
    />
  );
});
Button.displayName = "Button";
