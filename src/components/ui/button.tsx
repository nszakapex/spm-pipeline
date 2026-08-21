import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--spm-blue-secondary)]/45 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "rounded-md bg-[var(--spm-blue-primary)] text-white hover:bg-[var(--spm-blue-secondary)]",
        secondary:
          "rounded-md border border-[rgba(7,22,74,0.12)] bg-white text-[var(--spm-navy)] hover:bg-[#f7f9ff]",
        ghost:
          "rounded-md text-[var(--spm-navy)]/80 hover:bg-[rgba(7,22,74,0.05)]",
        danger:
          "rounded-md bg-[var(--spm-danger)] text-white hover:opacity-95",
      },
      size: {
        sm: "h-9 px-3.5 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-7 text-[0.95rem]",
        icon: "size-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
