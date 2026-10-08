// src/components/organisms/form/types/form.types.ts

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

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  options?: FormOption[];
  disabled?: boolean;
  // 🚀 Permitimos que 'visible' sea un booleano o una función reactiva del estado del form
  visible?: boolean | ((formData: Record<string, FormFieldValue>) => boolean);
  gridSpan?: number;
  fullWidth?: boolean;
  render?: (value: any, onChange: (newValue: any) => void) => React.ReactNode; 
  defaultValue?: FormFieldValue;
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
  onChange?: (name: string, value: FormFieldValue) => void;
}