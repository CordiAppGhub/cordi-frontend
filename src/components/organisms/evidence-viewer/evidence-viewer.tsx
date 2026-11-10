'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ExternalLink, FileText, X } from 'lucide-react';
import { getEvidenceAttachments, type EvidenceAttachmentSource } from './evidence-attachments';
import styles from './evidence-viewer.module.css';

interface ImageViewerProps {
  images: string[];
  index: number;
  label: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function ImageViewer({ images, index, label, onClose, onIndexChange }: ImageViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = images[index];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  if (!url) return null;
  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label={`Visor de ${label}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1);
        if (event.key === 'ArrowRight' && index < images.length - 1) onIndexChange(index + 1);
      }}
    >
      <div className={styles.viewer}>
        <header className={styles.viewerHeader}>
          <strong>{label} · {index + 1} / {images.length}</strong>
          <button type="button" onClick={onClose} aria-label="Cerrar visor"><X size={22} /></button>
        </header>
        <div className={styles.imageArea}>
          {failedUrl === url ? (
            <p role="alert">No se pudo cargar la imagen. <a href={url} target="_blank" rel="noopener noreferrer">Abrir archivo original</a></p>
          ) : (
            <Image src={url} alt={`${label}, imagen ${index + 1}`} width={1400} height={1000} unoptimized className={styles.image} onError={() => setFailedUrl(url)} />
          )}
        </div>
        <footer className={styles.controls}>
          <button type="button" disabled={index === 0} onClick={() => onIndexChange(index - 1)}><ChevronLeft size={18} /> Anterior</button>
          <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> Abrir original</a>
          <button type="button" disabled={index === images.length - 1} onClick={() => onIndexChange(index + 1)}>Siguiente <ChevronRight size={18} /></button>
        </footer>
      </div>
    </dialog>
  );
}

export function EvidenceViewer({ evidence }: { evidence: EvidenceAttachmentSource }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const attachments = getEvidenceAttachments(evidence);
  const images = attachments.filter((item) => !item.isPdf);
  const documents = attachments.filter((item) => item.isPdf);

  if (!attachments.length) return <p className={styles.empty}>Sin archivo adjunto</p>;
  return (
    <div className={styles.attachments}>
      {images.map((image, index) => (
        <button key={image.url} type="button" className={styles.thumbnailButton} onClick={() => setSelectedIndex(index)} aria-label={`Ampliar ${evidence.type}, imagen ${index + 1} de ${images.length}`}>
          <Image src={image.url} alt="" width={300} height={200} unoptimized className={styles.thumbnail} />
          <span>Ver imagen {index + 1}</span>
        </button>
      ))}
      {documents.map((document, index) => (
        <a key={document.url} className={styles.document} href={document.url} target="_blank" rel="noopener noreferrer">
          <FileText size={20} /> Abrir PDF {documents.length > 1 ? index + 1 : ''} <ExternalLink size={14} />
        </a>
      ))}
      {selectedIndex !== null && selectedIndex < images.length && (
        <ImageViewer images={images.map((item) => item.url)} index={selectedIndex} label={evidence.type || 'Evidencia'} onClose={() => setSelectedIndex(null)} onIndexChange={setSelectedIndex} />
      )}
    </div>
  );
}
