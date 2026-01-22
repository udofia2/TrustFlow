import React from "react";

export type SpinnerSize = "sm" | "md" | "lg" | "xl";
export type SpinnerVariant = "primary" | "secondary";

export interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
  fullPage?: boolean;
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-3",
  xl: "w-12 h-12 border-4",
};

const variantStyles: Record<SpinnerVariant, string> = {
  primary: "border-emerald-green border-t-transparent",
  secondary: "border-bitcoin-orange border-t-transparent",
};

/**
 * Loading spinner component with different sizes and variants
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  variant = "primary",
  className = "",
  fullPage = false,
}) => {
  const spinner = (
    <div
      className={`${sizeStyles[size]} ${variantStyles[variant]} rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

