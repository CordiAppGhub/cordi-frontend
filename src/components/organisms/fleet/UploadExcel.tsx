'use client';

import { useState } from 'react';
import styles from './upload-excel.module.css';
import type { BulkImportResult } from '@/types/bulk-import';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';

interface UploadExcelProps {
  title: string;
  description: React.ReactNode;
  onUpload: (file: File) => Promise<BulkImportResult | void>;
  onSuccess?: () => void;
}

export default function UploadExcel({ 
  title, 
  description, 
  onUpload, 
  onSuccess 
}: UploadExcelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: 'success' | 'error';
    details: string[];
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    try {
     
      const result = await onUpload(file);
      setMessage({
        text: result?.message || '¡Importación exitosa!',
        type: result?.success === false ? 'error' : 'success',
        details: result?.errors ?? [],
      });
      setFile(null); 

     
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Error al importar el Excel:', error);
      setMessage({
        text: getUserFriendlyErrorMessage(
          error,
          'Error al procesar el archivo. Verifica las columnas.',
        ),
        type: 'error',
        details: [],
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>

      {message && (
        <div
          role="alert"
          className={message.type === 'success' ? styles.alertSuccess : styles.alertError}
        >
          <p>{message.text}</p>
          {message.details.length > 0 && (
            <ul>
              {message.details.slice(0, 5).map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
              {message.details.length > 5 && (
                <li>Y {message.details.length - 5} error(es) adicional(es).</li>
              )}
            </ul>
          )}
        </div>
      )}

      <div className={styles.formGroup}>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileChange}
          className={styles.fileInput}
        />

        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className={styles.uploadButton}
        >
          {isUploading ? 'Procesando...' : 'Importar Archivo'}
        </button>
      </div>  
    </div>
  );
}