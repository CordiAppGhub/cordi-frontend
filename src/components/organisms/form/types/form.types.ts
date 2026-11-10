// src/components/organisms/form/types/form.types.ts
import type {
  DefaultValues,
  FieldErrors,
  FieldValues,
  Resolver,
} from 'react-hook-form';

export type FormFieldType = 
  | 'text' | 'number' | 'email' | 'password' 
  | 'select' | 'checkbox' | 'radio' | 'textarea'
  | 'multiselect' | 'datetime-local' | 'date'
  | 'time' | 'file' 
  | 'custom'; 

// 🚀 Ampliamos para permitir arreglos de objetos (como clientsData)
export type FormFieldValue = string | number | boolean | string[] | number[] | any[] | Record<string, any> | null | undefined; 

export interface FormOption {
  label: string;
  value: string | number;
}

export type FormOptions =
  | FormOption[]
  | ((formData: Record<string, FormFieldValue>) => FormOption[]);

export interface FormField {
  name: string;
  label: string | ((formData: Record<string, FormFieldValue>) => string);
  type: FormFieldType;
  placeholder?: string;
  options?: FormOptions;
  disabled?: boolean | ((formData: Record<string, FormFieldValue>) => boolean);
  // 🚀 Permitimos que 'visible' sea un booleano o una función reactiva del estado del form
  visible?: boolean | ((formData: Record<string, FormFieldValue>) => boolean);
  gridSpan?: number;
  fullWidth?: boolean;
  sectionTitle?: boolean;
  layoutClass?: 'cargoTypeSection';
  reserveSpaceWhenHidden?: boolean;
  render?: (
    value: any,
    onChange: (newValue: any) => void,
    validationErrors?: Record<string, string>,
  ) => React.ReactNode;
  defaultValue?: FormFieldValue;
}

export interface SuperFormProps<
  TFieldValues extends FieldValues = FieldValues,
  TTransformedValues extends FieldValues = TFieldValues,
> {
  fields: FormField[];
  defaultValues?: DefaultValues<TFieldValues> | Record<string, FormFieldValue>;
  errors?: Record<string, string>;
  isLoading?: boolean;
  submitText?: string;
  cancelText?: string;
  onSubmit: (formData: Record<string, FormFieldValue>) => void;
  onInvalid?: (errors: FieldErrors<TFieldValues>) => void;
  onCancel?: () => void;
  onChange?: (name: string, value: FormFieldValue) => void;
  clearFieldsOnChange?: Record<string, string[]>;
  resolver?: Resolver<TFieldValues, unknown, TTransformedValues>;
  renderFooter?: (isValid: boolean) => React.ReactNode;
  onValidationErrorsChange?: (errors: Record<string, string>) => void;
  closeRequestRef?: React.MutableRefObject<() => void>;
  setFieldsOnChange?: (
    name: string,
    value: FormFieldValue,
  ) => Record<string, FormFieldValue>;
}