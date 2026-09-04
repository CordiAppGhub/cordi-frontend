import React from 'react';
import styles from './input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input: React.FC<InputProps> = ({ error, className = '', ...props }) => {
  return (
    <div className={`${styles.inputWrapper} ${className}`}>
      <input className={`${styles.input} ${error ? styles.error : ''}`} {...props} />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};