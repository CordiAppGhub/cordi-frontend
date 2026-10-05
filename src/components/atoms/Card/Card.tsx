// components/atoms/Card/Card.tsx
import React, { HTMLAttributes } from 'react';
import styles from './Card.module.css';

// ==========================================
// 1. Contenedor Principal (Atomo)
// ==========================================
export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ className = '', children, ...props }) => {
  return (
    <div className={`${styles.card} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

// ==========================================
// 2. Sub-componentes (Moléculas opcionales)
// ==========================================
export const CardHeader: React.FC<CardProps> = ({ className = '', children, ...props }) => {
  return (
    <div className={`${styles.header} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({ className = '', children, ...props }) => {
  return (
    <h3 className={`${styles.title} ${className}`.trim()} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<HTMLAttributes<HTMLParagraphElement>> = ({ className = '', children, ...props }) => {
  return (
    <p className={`${styles.description} ${className}`.trim()} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<CardProps> = ({ className = '', children, ...props }) => {
  return (
    <div className={`${styles.content} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({ className = '', children, ...props }) => {
  return (
    <div className={`${styles.footer} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};