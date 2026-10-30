"use client";

import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  asChild?: never;
}

export function ButtonComponent({
  className,
  variant = "default",
  size = "default",
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    default: "bg-primary text-primary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    outline: "border border-input bg-background",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };
  const sizes = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-9 px-3 text-sm",
    lg: "h-11 px-8 text-sm",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      className={twMerge(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        // Minimum 44x44px tap target for mobile accessibility
        "min-h-[44px] min-w-[44px]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
