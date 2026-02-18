'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import styles from './CustomSelect.module.css';

interface Option {
  value: string;
  label: string;
  icon?: ReactNode;
  color?: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'light';
}

export default function CustomSelect({ options, value, onChange, placeholder = 'Select...', className = '', variant = 'default' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const containerClass = `${styles.container} ${className} ${variant === 'compact' ? styles.compact : ''} ${variant === 'light' ? styles.light : ''}`;

  return (
    <div ref={ref} className={containerClass}>
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption ? (
          <span className={styles.selectedValue}>
            {selectedOption.color && (
              <span className={styles.colorSwatch} style={{ backgroundColor: selectedOption.color }} />
            )}
            <span className={styles.label}>{selectedOption.label}</span>
          </span>
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
        <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              className={`${styles.option} ${option.value === value ? styles.optionSelected : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.color && (
                <span className={styles.colorSwatch} style={{ backgroundColor: option.color }} />
              )}
              <span className={styles.label}>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
