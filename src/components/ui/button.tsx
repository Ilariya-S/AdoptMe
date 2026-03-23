import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const baseClasses =
      "rounded-lg font-medium transition-colors";
    const variantClasses = {
      default: "bg-amber-600 text-white hover:bg-amber-700",
      outline: "border border-amber-600 text-amber-600 hover:bg-amber-50",
      ghost: "text-amber-700 hover:bg-amber-100",
    };
    const sizeClasses = {
      default: "px-4 py-2",
      sm: "px-3 py-1 text-sm",
      icon: "p-2",
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} button-press ${className}`}
        {...props}
      >
        {props.children}
      </button>
    );
  }
);

Button.displayName = "Button";
