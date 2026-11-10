import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import styles from './select.module.css';

interface SelectProps
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    'onChange'
  > {
  options?: {
    value: string | number;
    label: string;
      disabled?: boolean;
    }[];

    error?: string;
    wrapperClassName?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
    onValueChange?: (value: string) => void;

    onChange?: (
      e: React.ChangeEvent<HTMLSelectElement>,
    selectedValues: string[]
  ) => void;
}

export const Select: React.FC<SelectProps> = ({
  options = [],
  error,
  wrapperClassName = '',
  className = '',
  multiple = false,
  searchable = false,
  searchPlaceholder = 'Buscar o seleccionar...',
  onValueChange,
  onChange,
  children,
  value,
  defaultValue,
  disabled = false,
  required = false,
  id,
  name,
  title,
  autoFocus,
  tabIndex,
  dir,
  lang,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(
    String(defaultValue ?? ''),
  );
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const listboxId = `${id ?? generatedId}-options`;
  const selectedValue = value === undefined ? internalValue : String(value ?? '');
  const selectedOption = options.find(
    (option) => String(option.value) === selectedValue,
  );
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return options.filter((option) =>
      option.label.toLocaleLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);
  const highlightedIndex = filteredOptions[activeIndex]?.disabled
    ? filteredOptions.findIndex((option) => !option.disabled)
    : activeIndex;

  const updateMenuPosition = () => {
    const anchor = inputRef.current?.getBoundingClientRect();
    if (!anchor) return;

    const spaceBelow = window.innerHeight - anchor.bottom - 8;
    const spaceAbove = anchor.top - 8;
    const openAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
    const availableSpace = Math.max(80, openAbove ? spaceAbove : spaceBelow);
    const maxHeight = Math.min(280, availableSpace);

    setMenuPosition({
      top: openAbove ? anchor.top - maxHeight - 4 : anchor.bottom + 4,
      left: Math.max(8, Math.min(anchor.left, window.innerWidth - anchor.width - 8)),
      width: Math.min(anchor.width, window.innerWidth - 16),
      maxHeight,
    });
  };

  useEffect(() => {
    if (!isOpen || !searchable || multiple) return;

    updateMenuPosition();
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !wrapperRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
        setQuery('');
      }
    };
    const handleViewportChange = () => updateMenuPosition();

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen, multiple, searchable]);

  useEffect(() => {
    if (highlightedIndex >= 0) {
      menuRef.current
        ?.querySelector<HTMLElement>(`[data-option-index="${highlightedIndex}"]`)
        ?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const selectValue = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) setIsOpen(true);
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const availableOptions = filteredOptions
        .map((option, index) => ({ option, index }))
        .filter(({ option }) => !option.disabled);
      if (!availableOptions.length) return;
      const currentPosition = availableOptions.findIndex(
        ({ index }) => index === activeIndex,
      );
      const nextPosition = currentPosition < 0
        ? direction > 0
          ? 0
          : availableOptions.length - 1
        : (currentPosition + direction + availableOptions.length) %
          availableOptions.length;
      setActiveIndex(availableOptions[nextPosition].index);
    } else if (event.key === 'Enter' && isOpen && highlightedIndex >= 0) {
      event.preventDefault();
      const option = filteredOptions[highlightedIndex];
      if (option && !option.disabled) selectValue(String(option.value));
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      setQuery('');
    }
  };

  if (searchable && !multiple) {
    return (
      <div
        ref={wrapperRef}
        className={`w-full ${wrapperClassName}`.trim()}
      >
        <input
          ref={inputRef}
          id={id}
          name={name}
          title={title}
          autoFocus={autoFocus}
          tabIndex={tabIndex}
          dir={dir}
          lang={lang}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            isOpen && highlightedIndex >= 0
              ? `${listboxId}-${highlightedIndex}`
              : undefined
          }
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          value={isOpen ? query : selectedOption?.label ?? ''}
          placeholder={searchPlaceholder}
          disabled={disabled}
          onFocus={() => {
            if (!isOpen) {
              setQuery('');
              setActiveIndex(0);
              setIsOpen(true);
            }
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onKeyDown={handleSearchKeyDown}
          className={`${styles.select} ${styles.searchableInput} ${className} ${
            error ? styles.error : ''
          }`}
        />

        {isOpen &&
          menuPosition &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              ref={menuRef}
              id={listboxId}
              role="listbox"
              className={styles.searchableMenu}
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
                width: menuPosition.width,
                maxHeight: menuPosition.maxHeight,
              }}
            >
              {filteredOptions.length ? (
                filteredOptions.map((option, index) => (
                  <button
                    key={String(option.value)}
                    id={`${listboxId}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={String(option.value) === selectedValue}
                    disabled={option.disabled}
                    data-option-index={index}
                    className={`${styles.searchableOption} ${
                      index === highlightedIndex ? styles.activeOption : ''
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectValue(String(option.value))}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <span className={styles.noSearchResults}>
                  No se encontraron opciones.
                </span>
              )}
            </div>,
            document.body,
          )}

        {error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (onChange) {
      const values = Array.from(
        e.target.selectedOptions,
        (option) => option.value
      );

      onChange(e, values);
    }
  };

  return (
    <div className={`w-full ${wrapperClassName}`.trim()}>
      <select
        {...props}
        id={id}
        name={name}
        value={value}
        defaultValue={defaultValue}
        multiple={multiple}
        disabled={disabled}
        required={required}
        onChange={handleChange}
        className={`${styles.select} ${className} ${
          error ? styles.error : ''
        }`}
      >
        {!multiple && !children && (
          <option value="" disabled hidden>
            Selecciona una opción
          </option>
        )}

        {options.map((option) => (
          <option
            key={String(option.value)}
            value={option.value}
          >
            {option.label}
          </option>
        ))}

        {children}
      </select>

      {error && (
        <span className={styles.errorMessage}>
          {error}
        </span>
      )}
    </div>
  );
};