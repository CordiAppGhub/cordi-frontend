export type FormFieldType = 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox' | 'radio' | 'date';

export type FormFieldValue = string | number | boolean | undefined;

export interface FormOption {
  label: string;
  value: string | number;
}

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  options?: FormOption[];
  disabled?: boolean;
  visible?: boolean;
}

export interface SuperFormProps {
  fields: FormField[];
  defaultValues?: Record<string, FormFieldValue>;
  errors?: Record<string, string>;
  isLoading?: boolean;
  submitText?: string;
  cancelText?: string;
  onSubmit: (formData: Record<string, FormFieldValue>) => void;
  onCancel?: () => void;
  onChange?: (name: string, value: FormFieldValue) => void; // 👈 NUEVO
}