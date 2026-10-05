import React from 'react';

import styles from './select.module.css';

interface SelectProps
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    'onChange'
  > {
  options?: {
    value: string | number;
    label: string;
  }[];

  error?: string;

  onChange?: (
    e: React.ChangeEvent<HTMLSelectElement>,
    selectedValues: string[]
  ) => void;
}

export const Select: React.FC<SelectProps> = ({
  options = [],
  error,
  className = '',
  multiple = false,
  onChange,
  children,
  ...props
}) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (onChange) {
      const values = Array.from(
        e.target.selectedOptions,
        (option) => option.value
      );

      onChange(e, values);
    }
  };

  return (
    <div className="w-full">
      <select
        {...props}
        multiple={multiple}
        onChange={handleChange}
        className={`${styles.select} ${className} ${
          error ? styles.error : ''
        }`}
      >
        {!multiple && !children && (
          <option value="" disabled hidden>
            Selecciona una opción
          </option>
        )}

        {options.map((option) => (
          <option
            key={String(option.value)}
            value={option.value}
          >
            {option.label}
          </option>
        ))}

        {children}
      </select>

      {error && (
        <span className={styles.errorMessage}>
          {error}
        </span>
      )}
    </div>
  );
};