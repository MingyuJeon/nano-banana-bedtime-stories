import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  onClick,
  disabled = false,
  size = 'md',
  variant = 'default',
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    default: 'bg-purple-600 text-white hover:bg-purple-700',
    ghost: 'bg-transparent hover:bg-gray-100',
    outline: 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50',
  };

  return (
    <button
      className={`rounded-md font-medium transition-all ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
};