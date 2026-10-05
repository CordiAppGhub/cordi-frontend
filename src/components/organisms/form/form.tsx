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
          const isVisible = typeof field.visible === 'function'
            ? field.visible(formData)
            : field.visible !== false;
          if (!isVisible) return null;

          const value = formData[field.name] !== undefined ? formData[field.name] : '';
          const errorMessage = errors[field.name];

          const isFullWidth = field.type === 'textarea' || field.type === 'multiselect' || field.fullWidth;

          return (
            <div
              key={field.name}
              className={`${styles.formGroup} ${isFullWidth ? styles.fullWidth : ''}`}
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
                    // 🚀 Nuevo diseño de multiselect: Lista de checkboxes con scroll
                    return (
                      <div className={styles.multiselectContainer}>
                        {field.options?.map((opt) => {
                          const isChecked = Array.isArray(value) && value.includes(String(opt.value));
                          return (
                            <label key={opt.value} className={styles.multiselectOption}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const currentValues = Array.isArray(value) ? value.map(String) : [];
                                  const newValues = e.target.checked
                                    ? [...currentValues, String(opt.value)]
                                    : currentValues.filter((v) => v !== String(opt.value));
                                  handleChange(field.name, newValues);
                                }}
                                disabled={field.disabled || isLoading}
                                className={styles.checkboxInput}
                              />
                              <span>{opt.label}</span>
                            </label>
                          );
                        })}
                      </div>
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
                  case 'custom':
                    // 🚀 Inyectamos la UI personalizada pasándole el valor actual y la función para mutarlo
                    return field.render
                      ? field.render(value, (newVal) => handleChange(field.name, newVal))
                      : null;

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