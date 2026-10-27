import React, { ReactNode } from 'react';
import styles from './page-header.module.css';

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  titleLevel?: 1 | 2;
  alignment?: 'center' | 'start' | 'end';
  className?: string;
  contentClassName?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  titleLevel = 1,
  alignment = 'center',
  className = '',
  contentClassName = '',
  eyebrowClassName = '',
  titleClassName = '',
  descriptionClassName = '',
}: PageHeaderProps) {
  const Heading = titleLevel === 1 ? 'h1' : 'h2';

  return (
    <header
      className={`${styles.header} ${styles[`align${alignment[0].toUpperCase()}${alignment.slice(1)}`]} ${className}`.trim()}
    >
      <div className={`${styles.content} ${contentClassName}`.trim()}>
        {eyebrow && (
          <div className={`${styles.eyebrow} ${eyebrowClassName}`.trim()}>
            {eyebrow}
          </div>
        )}
        <Heading className={`${styles.title} ${titleClassName}`.trim()}>
          {title}
        </Heading>
        {description && (
          <p className={`${styles.description} ${descriptionClassName}`.trim()}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
