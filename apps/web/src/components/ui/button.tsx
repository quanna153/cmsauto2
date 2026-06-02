import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-[#a88412] text-white hover:bg-[#80640b]",
        secondary: "border bg-white text-[#273247] hover:bg-[#f7f7f4]",
        ghost: "text-[#566174] hover:bg-[#f1f2ee]",
        danger: "bg-[#c93a3a] text-white hover:bg-[#a62e2e]"
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2",
        lg: "px-5 py-3"
      }
    },
    defaultVariants: { variant: "primary", size: "md" }
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

