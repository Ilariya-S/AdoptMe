import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 ${className}`}
      {...props}
    />
  )
);

Input.displayName = "Input";
