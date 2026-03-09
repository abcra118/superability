import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-[#004B87] text-white hover:bg-[#002D52] active:bg-[#002D52] shadow-md border-b-4 border-[#002D52]',
      secondary: 'bg-[#F0F7FF] text-[#004B87] border-4 border-[#004B87] hover:bg-blue-100',
      ghost: 'bg-transparent text-[#004B87] font-black hover:underline px-2',
      danger: 'bg-[#B00020] text-white hover:bg-red-800',
    };

    const sizes = {
      md: 'px-6 py-3 text-lg font-bold',
      lg: 'px-8 py-6 text-2xl font-black rounded-3xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none ring-offset-2 focus-visible:ring-4 focus-visible:ring-[#FFB81C]',
          variants[variant],
          sizes[size],
          className
        )}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="mr-3 animate-spin text-2xl" aria-hidden="true">◎</span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
