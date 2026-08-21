import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--spm-blue-secondary)]/45 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "rounded-full bg-gradient-to-b from-[var(--spm-sky)] to-[var(--spm-blue-primary)] text-white shadow-[0_10px_22px_rgba(28,72,230,0.18)] hover:-translate-y-px active:scale-[0.985]",
        secondary:
          "rounded-full border border-[rgba(7,22,74,0.12)] bg-white text-[var(--spm-navy)] hover:border-[rgba(7,22,74,0.2)] hover:bg-[#f7f9ff]",
        ghost:
          "rounded-full text-[var(--spm-navy)]/80 hover:bg-[rgba(7,22,74,0.05)]",
        danger:
          "rounded-full bg-[var(--spm-danger)] text-white hover:opacity-95",
      },
      size: {
        sm: "h-9 px-3.5 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-7 text-[0.95rem]",
        icon: "size-10 rounded-full",
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
