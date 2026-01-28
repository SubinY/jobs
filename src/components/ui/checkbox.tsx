import * as React from "react";
import { cn } from "@/lib/utils";

export type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type ?? "checkbox"}
      className={cn("ui-checkbox", className)}
      {...props}
    />
  )
);

Checkbox.displayName = "Checkbox";
