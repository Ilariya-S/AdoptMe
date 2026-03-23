import React from "react";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = "", ...props }, ref) => (
    <label
      ref={ref}
      className={`text-sm font-medium text-amber-900 ${className}`}
      {...props}
    />
  )
);

Label.displayName = "Label";
