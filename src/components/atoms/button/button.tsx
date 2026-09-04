import React from 'react';
import styles from './button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const variantClass = variant === 'secondary' ? styles['button--secondary'] : styles['button--primary'];

  return (
    <button className={`${styles.button} ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
};