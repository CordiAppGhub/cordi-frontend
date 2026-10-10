import React from 'react';
import styles from './button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false,
  className = '', 
  disabled,
  ...props 
}) => {
  const variantClass = variant === 'secondary' ? styles['button--secondary'] : styles['button--primary'];

  return (
    <button
      className={`${styles.button} ${variantClass} ${className}`}
      {...props}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
    >
      {isLoading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
};