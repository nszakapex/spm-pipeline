import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--spm-radius)] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--spm-sky)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-b from-[var(--spm-sky)] to-[var(--spm-blue-primary)] text-white hover:opacity-95",
        secondary:
          "border border-[var(--spm-navy)] bg-white text-[var(--spm-navy)] hover:bg-[var(--spm-cream)]",
        ghost:
          "text-[var(--spm-navy)]/80 hover:bg-[var(--spm-sand)]",
        danger:
          "border border-[var(--spm-navy)] bg-[var(--spm-navy)] text-[var(--spm-cream)] hover:opacity-95",
      },
      size: {
        sm: "h-9 px-3.5 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-sm",
        icon: "size-9",
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
