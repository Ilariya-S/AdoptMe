import React from "react";

interface RadioGroupProps extends React.FieldsetHTMLAttributes<HTMLFieldSetElement> {
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroupContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

export const RadioGroup = React.forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  ({ value = "", onValueChange, ...props }, ref) => (
    <fieldset ref={ref} {...props}>
      <RadioGroupContext.Provider value={{ value, onValueChange: onValueChange || (() => {}) }}>
        {props.children}
      </RadioGroupContext.Provider>
    </fieldset>
  )
);

RadioGroup.displayName = "RadioGroup";

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ value, className = "", ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);
    
    return (
      <input
        ref={ref}
        type="radio"
        value={value}
        checked={context?.value === value}
        onChange={(e) => context?.onValueChange(e.currentTarget.value)}
        className={`w-4 h-4 rounded-full border-2 border-amber-300 checked:bg-amber-600 ${className}`}
        {...props}
      />
    );
  }
);

RadioGroupItem.displayName = "RadioGroupItem";
