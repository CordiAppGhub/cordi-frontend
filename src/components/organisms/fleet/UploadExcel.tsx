'use client';

import { useState } from 'react';
import styles from './upload-excel.module.css';

interface UploadExcelProps {
  title: string;
  description: React.ReactNode;
  onUpload: (file: File) => Promise<void>;
  onSuccess?: () => void;
}

export default function UploadExcel({ 
  title, 
  description, 
  onUpload, 
  onSuccess 
}: UploadExcelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
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
      // Ejecutamos la función que nos pase el componente padre
      await onUpload(file);
      
      setMessage({ text: '¡Importación exitosa!', type: 'success' });
      setFile(null); // Limpiamos el archivo tras el éxito

      // Ejecutamos el refresco de la tabla si el padre lo envió
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Error al importar el Excel:', error);
      setMessage({ text: 'Error al procesar el archivo. Verifica las columnas.', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>

      {message && (
        <div className={message.type === 'success' ? styles.alertSuccess : styles.alertError}>
          {message.text}
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