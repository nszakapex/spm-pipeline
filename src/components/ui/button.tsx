import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--spm-sky)]/60 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "rounded-full text-white [background-image:linear-gradient(180deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0)_42%),linear-gradient(180deg,var(--spm-sky),var(--spm-blue-primary))] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_10px_22px_rgba(28,72,230,0.28)] hover:-translate-y-px active:scale-[0.985]",
        secondary:
          "rounded-full border border-[rgba(7,22,74,0.12)] bg-white text-[var(--spm-navy)] shadow-[inset_0_1px_0_#fff] hover:bg-[#f7f9ff]",
        ghost:
          "rounded-full text-[var(--spm-navy)]/80 hover:bg-[rgba(7,22,74,0.05)]",
        danger:
          "rounded-full bg-[var(--spm-navy)] text-[var(--spm-cream)] hover:opacity-95",
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
