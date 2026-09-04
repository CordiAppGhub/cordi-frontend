'use client';

import React, { useState } from 'react';
import { Input } from '../../atoms/input/input';
import { Select } from '../../atoms/select/select';
import { Button } from '../../atoms/button/button';
import { SuperFormProps, FormFieldValue } from './types/form.types';

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
  // 1. Usamos el tipo estricto en el estado (Chao "any")
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {fields.map((field) => {
        if (field.visible === false) return null;

        const value = formData[field.name] !== undefined ? formData[field.name] : '';
        const errorMessage = errors[field.name];

        return (
          <div key={field.name} className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label className="text-sm font-semibold text-gray-700">
              {field.label}
            </label>

            {(() => {
              switch (field.type) {
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

                case 'checkbox':
                  return (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        name={field.name}
                        checked={Boolean(value)}
                        onChange={(e) => handleChange(field.name, e.target.checked)}
                        disabled={field.disabled || isLoading}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span>{field.placeholder || 'Activar'}</span>
                    </label>
                  );

                case 'radio':
                  return (
                    <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                      {field.options?.map((opt) => (
                        <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
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
          </div>
        );
      })}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
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