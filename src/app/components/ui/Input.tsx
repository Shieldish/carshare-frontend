import React from 'react';
import { cn } from '@/lib/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

/**
 * Input piloté par les tokens (border/input/ring) — corrige au passage le bug
 * de LoginForm.tsx où les champs n'avaient aucune variante `dark:` et
 * restaient clairs en mode sombre.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid = false, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-md border bg-background text-foreground px-3 py-2 text-body',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        invalid ? 'border-destructive' : 'border-input',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('block text-small font-medium text-foreground mb-1.5', className)} {...props} />;
}

export default Input;
