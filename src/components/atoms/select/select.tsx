import React from 'react';
import styles from './select.module.css';

// 🚀 Extendemos de HTMLSelectElement pero redefinimos onChange para mayor comodidad
interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: { value: string | number; label: string }[];
  error?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>, selectedValues: string[]) => void;
}

export const Select: React.FC<SelectProps> = ({ options, error, className = '', multiple, onChange, ...props }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      // Magia para el multi-select: Extraemos todos los valores marcados a un array
      const values = Array.from(e.target.selectedOptions, option => option.value);
      onChange(e, values);
    }
  };

  return (
    <div className={className}>
      <select 
        className={`${styles.select} ${error ? styles.error : ''}`} 
        multiple={multiple}
        onChange={handleChange}
        {...props}
      >
        {/* Si es múltiple, no necesitamos la opción placeholder por defecto */}
        {!multiple && <option value="" disabled hidden>Selecciona una opción</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};