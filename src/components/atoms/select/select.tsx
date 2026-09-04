import React from 'react';
import styles from './select.module.css';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string | number; label: string }[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ options, error, className = '', ...props }) => {
  return (
    <div className={className}>
      <select className={`${styles.select} ${error ? styles.error : ''}`} {...props}>
        <option value="" disabled hidden>Selecciona una opción</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};