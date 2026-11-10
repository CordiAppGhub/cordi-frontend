'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import {
  Controller,
  type DefaultValues,
  useForm,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
} from 'react-hook-form';
import { Input } from '../../atoms/input/input';
import { Select } from '../../atoms/select/select';
import { Button } from '../../atoms/button/button';
import { SuperFormProps, FormFieldValue } from './types/form.types';
import styles from './SuperForm.module.css';

const EMPTY_DEFAULT_VALUES: Record<string, FormFieldValue> = {};

const getValidationErrors = (
  errors: unknown,
  path = '',
): Record<string, string> => {
  if (!errors || typeof errors !== 'object') return {};

  const errorRecord = errors as Record<string, unknown>;
  const message =
    'message' in errorRecord && typeof errorRecord.message === 'string'
      ? errorRecord.message
      : undefined;
  const nestedErrors = Object.fromEntries(
    Object.entries(errorRecord)
      .filter(([key]) => !['message', 'ref', 'type', 'types'].includes(key))
      .flatMap(([key, value]) =>
        Object.entries(
          getValidationErrors(value, path ? `${path}.${key}` : key),
        ),
      ),
  );

  return {
    ...(message && path ? { [path]: message } : {}),
    ...nestedErrors,
  };
};

const areValuesEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true;
  if (left instanceof Date || right instanceof Date) {
    return (
      left instanceof Date &&
      right instanceof Date &&
      left.getTime() === right.getTime()
    );
  }
  if (
    typeof left !== 'object' ||
    left === null ||
    typeof right !== 'object' ||
    right === null ||
    Array.isArray(left) !== Array.isArray(right)
  ) {
    return false;
  }

  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);
  return (
    leftEntries.length === rightEntries.length &&
    leftEntries.every(
      ([key, value]) =>
        Object.prototype.hasOwnProperty.call(right, key) &&
        areValuesEqual(value, (right as Record<string, unknown>)[key]),
    )
  );
};

export function SuperForm<
  TFieldValues extends FieldValues = FieldValues,
  TTransformedValues extends FieldValues = TFieldValues,
>({
  fields,
  defaultValues = EMPTY_DEFAULT_VALUES,
  errors = {},
  isLoading = false,
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  onSubmit,
  onInvalid,
  onCancel,
  onChange,
  clearFieldsOnChange = {},
  resolver,
  renderFooter,
  onValidationErrorsChange,
  closeRequestRef,
  setFieldsOnChange,
}: SuperFormProps<TFieldValues, TTransformedValues>) {
  const {
    handleSubmit: submitForm,
    control,
    reset,
    setValue,
    trigger,
    watch,
    formState,
  } = useForm<TFieldValues, unknown, TTransformedValues>({
    defaultValues: defaultValues as DefaultValues<TFieldValues>,
    mode: 'all',
    resolver,
  });
  const { errors: formErrors, isDirty, isValid } = formState;
  const formData = watch() as Record<string, FormFieldValue>;
  const previousDefaultValues = useRef(defaultValues);
  const validationErrors = useMemo(
    () => getValidationErrors(formErrors),
    [formErrors],
  );
  const fieldErrors = { ...validationErrors, ...errors };

  useEffect(() => {
    if (!closeRequestRef) return;
    closeRequestRef.current = () => {
      if (
        isDirty &&
        !window.confirm(
          'Tienes cambios sin guardar. ¿Estás seguro de que deseas descartar esta operación?',
        )
      ) {
        return;
      }

      reset();
      onCancel?.();
    };
  }, [closeRequestRef, isDirty, onCancel, reset]);

  useEffect(() => {
    onValidationErrorsChange?.(validationErrors);
  }, [onValidationErrorsChange, validationErrors]);

  useEffect(() => {
    const previous = previousDefaultValues.current;
    if (!areValuesEqual(previous, defaultValues)) {
      reset(defaultValues as DefaultValues<TFieldValues>);
      previousDefaultValues.current = defaultValues;
    }
  }, [defaultValues, reset]);

  const handleChange = (
    name: string,
    value: FormFieldValue,
    onFieldChange: (value: FormFieldValue) => void,
  ) => {
    onFieldChange(value);
    clearFieldsOnChange[name]?.forEach((fieldName) => {
      setValue(fieldName as FieldPath<TFieldValues>, '' as FieldPathValue<TFieldValues, FieldPath<TFieldValues>>, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: Boolean(resolver),
      });
    });
    Object.entries(setFieldsOnChange?.(name, value) ?? {}).forEach(
      ([fieldName, fieldValue]) => {
        setValue(fieldName as FieldPath<TFieldValues>, fieldValue as FieldPathValue<TFieldValues, FieldPath<TFieldValues>>, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: Boolean(resolver),
        });
      },
    );
    if (name === 'isContainerized') {
      if (value === false) {
        setValue(
          'shippingLineId' as FieldPath<TFieldValues>,
          null as FieldPathValue<TFieldValues, FieldPath<TFieldValues>>,
          { shouldValidate: true },
        );
      }
      void trigger('shippingLineId' as FieldPath<TFieldValues>);
    }
    if (onChange) {
      onChange(name, value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitForm((values) =>
      onSubmit(values as Record<string, FormFieldValue>),
      (invalidFields) => onInvalid?.(invalidFields),
    )(e);
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.fieldsGrid}>
        {fields.map((field) => {
          const isVisible = typeof field.visible === 'function'
            ? field.visible(formData)
            : field.visible !== false;
          if (!isVisible) {
            return field.reserveSpaceWhenHidden ? (
              <div
                key={field.name}
                className={`${styles.formGroup} ${styles.reservedField}`}
                aria-hidden="true"
              />
            ) : null;
          }

          const options = typeof field.options === 'function'
            ? field.options(formData)
            : field.options ?? [];
          const label = typeof field.label === 'function'
            ? field.label(formData)
            : field.label;
          const isDisabled = typeof field.disabled === 'function'
            ? field.disabled(formData)
            : field.disabled ?? false;
          const errorMessage =
            fieldErrors[field.name] ??
            Object.entries(validationErrors).find(([name]) =>
              name.startsWith(`${field.name}.`),
            )?.[1];

          const isFullWidth = field.type === 'textarea' || field.type === 'multiselect' || field.fullWidth;

          if (field.sectionTitle) {
            return (
              <div
                key={field.name}
                className={`${styles.formGroup} ${styles.sectionHeader}`}
              >
                <h3 className={styles.sectionTitle}>{label}</h3>
              </div>
            );
          }

          return (
            <Controller
              key={field.name}
              name={field.name as FieldPath<TFieldValues>}
              control={control}
              defaultValue={(field.defaultValue ?? '') as FieldPathValue<TFieldValues, FieldPath<TFieldValues>>}
              render={({ field: controllerField }) => {
                const value = (controllerField.value ?? '') as FormFieldValue;
                const onChange = (newValue: FormFieldValue) =>
                  handleChange(field.name, newValue, controllerField.onChange);

                return (
                  <div
                    className={`${styles.formGroup} ${isFullWidth ? styles.fullWidth : ''} ${field.layoutClass === 'cargoTypeSection' ? styles.cargoTypeSection : ''}`}
                  >
                    {field.type === 'checkbox' ? (
                      <span className={styles.label}>{label}</span>
                    ) : (
                      <label className={styles.label}>
                        {label}
                      </label>
                    )}

                    {(() => {
                      switch (field.type) {
                        case 'textarea':
                          return (
                            <textarea
                              name={field.name}
                              placeholder={field.placeholder}
                              value={String(value)}
                              onChange={(e) => onChange(e.target.value)}
                              onBlur={controllerField.onBlur}
                              disabled={isDisabled || isLoading}
                              className={styles.textareaInput}
                            />
                          );

                        case 'select':
                          return (
                            <Select
                              name={field.name}
                              options={options}
                              value={String(value)}
                              onChange={(e) => onChange(e.target.value)}
                              onBlur={controllerField.onBlur}
                              disabled={isDisabled || isLoading}
                              error={errorMessage}
                            />
                          );

                        case 'multiselect':
                          return (
                            <div className={styles.multiselectContainer}>
                              {options.map((opt) => {
                                const isChecked =
                                  Array.isArray(value) &&
                                  value.some(
                                    (selectedValue) =>
                                      String(selectedValue) ===
                                      String(opt.value),
                                  );
                                return (
                                  <label
                                    key={opt.value}
                                    className={styles.multiselectOption}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const currentValues = Array.isArray(
                                          value,
                                        )
                                          ? value.map(String)
                                          : [];
                                        const newValues = e.target.checked
                                          ? [
                                              ...currentValues,
                                              String(opt.value),
                                            ]
                                          : currentValues.filter(
                                              (v) => v !== String(opt.value),
                                            );
                                        onChange(newValues);
                                      }}
                                      disabled={isDisabled || isLoading}
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
                                onChange={(e) => onChange(e.target.checked)}
                                onBlur={controllerField.onBlur}
                                disabled={isDisabled || isLoading}
                                className={styles.checkboxInput}
                              />
                              <span>{field.placeholder || 'Activar'}</span>
                            </label>
                          );

                        case 'radio':
                          return (
                            <div className={styles.radioGroup}>
                              {options.map((opt) => (
                                <label
                                  key={opt.value}
                                  className={styles.radioLabel}
                                >
                                  <input
                                    type="radio"
                                    name={field.name}
                                    value={opt.value}
                                    checked={String(value) === String(opt.value)}
                                    onChange={(e) =>
                                      onChange(e.target.value)
                                    }
                                    disabled={isDisabled || isLoading}
                                  />
                                  {opt.label}
                                </label>
                              ))}
                            </div>
                          );

                        case 'custom':
                          return field.render
                            ? field.render(value, onChange, validationErrors)
                            : null;

                        default:
                          return (
                            <Input
                              type={field.type}
                              name={field.name}
                              placeholder={field.placeholder}
                              value={String(value)}
                              onChange={(e) => onChange(e.target.value)}
                              onBlur={controllerField.onBlur}
                              disabled={isDisabled || isLoading}
                              error={errorMessage}
                            />
                          );
                      }
                    })()}

                    {errorMessage && (
                      <span className={styles.errorMessage}>
                        {errorMessage}
                      </span>
                    )}
                  </div>
                );
              }}
            />
          );
        })}
      </div>

      {renderFooter ? (
        renderFooter(isValid)
      ) : (
        <div className={styles.actions}>
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
              {cancelText}
            </Button>
          )}
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {submitText}
          </Button>
        </div>
      )}
    </form>
  );
};