'use client';

import React, { useState } from 'react';
import { Input } from '../../atoms/input/input';
import { Select } from '../../atoms/select/select';
import { Button } from '../../atoms/button/button';
import { SuperFormProps, FormFieldValue } from './types/form.types';
import styles from './SuperForm.module.css';

export const SuperForm: React.FC<SuperFormProps> = ({
  fields,
  defaultValues = {},
  errors = {},
  isLoading = false,
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  onSubmit,
  onCancel,
  onChange,
}) => {
  const [formData, setFormData] = useState<Record<string, FormFieldValue>>(defaultValues);

  const handleChange = (name: string, value: FormFieldValue) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (onChange) {
      onChange(name, value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>

      <div className={styles.fieldsGrid}>
        {fields.map((field) => {
          if (field.visible === false) return null;

          const value = formData[field.name] !== undefined ? formData[field.name] : '';
          const errorMessage = errors[field.name];

          return (
            <div
              key={field.name}
              className={`${styles.formGroup} ${field.type === 'textarea' ? styles.fullWidth : ''}`}
            >
              <label className={styles.label}>
                {field.label}
              </label>

              {(() => {
                switch (field.type) {
                  case 'textarea':
                    return (
                      <textarea
                        name={field.name}
                        placeholder={field.placeholder}
                        value={String(value)}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        disabled={field.disabled || isLoading}
                        className={styles.textareaInput} 
                      />
                    );

                  case 'select':
                    return (
                      <Select
                        name={field.name}
                        options={field.options || []}
                        value={String(value)}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        disabled={field.disabled || isLoading}
                        error={errorMessage}
                      />
                    );
                  case 'multiselect':
                    return (
                      <select
                        multiple
                        name={field.name}
                        value={Array.isArray(value) ? value.map(String) : []}
                        onChange={(e) => {
                          const selectedValues = Array.from(e.target.selectedOptions).map(opt => opt.value);
                          handleChange(field.name, selectedValues);
                        }}
                        disabled={field.disabled || isLoading}
                        className={`${styles.textareaInput} ${styles.multiselect}`} 
                        style={{ height: '120px', padding: '8px' }} 
                      >
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value} style={{ padding: '6px', cursor: 'pointer' }}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    );

                  case 'checkbox':
                    return (
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          name={field.name}
                          checked={Boolean(value)}
                          onChange={(e) => handleChange(field.name, e.target.checked)}
                          disabled={field.disabled || isLoading}
                          className={styles.checkboxInput}
                        />
                        <span>{field.placeholder || 'Activar'}</span>
                      </label>
                    );

                  case 'radio':
                    return (
                      <div className={styles.radioGroup}>
                        {field.options?.map((opt) => (
                          <label key={opt.value} className={styles.radioLabel}>
                            <input
                              type="radio"
                              name={field.name}
                              value={opt.value}
                              checked={String(value) === String(opt.value)}
                              onChange={(e) => handleChange(field.name, e.target.value)}
                              disabled={field.disabled || isLoading}
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    );

                  default:
                    return (
                      <Input
                        type={field.type}
                        name={field.name}
                        placeholder={field.placeholder}
                        value={String(value)}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        disabled={field.disabled || isLoading}
                        error={errorMessage}
                      />
                    );
                }
              })()}

              {errorMessage && <span className={styles.errorMessage}>{errorMessage}</span>}
            </div>
          );
        })}
      </div>

      <div className={styles.actions}>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            {cancelText}
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? 'Cargando...' : submitText}
        </Button>
      </div>
    </form>
  );
};