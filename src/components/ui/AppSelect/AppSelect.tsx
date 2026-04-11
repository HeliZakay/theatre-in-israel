"use client";

import * as Select from "@radix-ui/react-select";
import styles from "./AppSelect.module.css";
import type { SelectOption } from "@/types";
import { cx } from "@/utils/cx";

interface AppSelectProps {
  id?: string;
  name?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options?: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  onBlur?: () => void;
}

export default function AppSelect({
  id,
  name,
  value = "",
  onValueChange,
  options = [],
  placeholder,
  ariaLabel,
  className,
  disabled = false,
  required = false,
  onBlur,
}: AppSelectProps) {
  return (
    <>
      <div className={styles.nativeWrapper}>
        <select
          id={id ? `${id}-native` : undefined}
          className={cx(styles.nativeSelect, className)}
          aria-label={ariaLabel}
          value={value}
          onChange={(e) => onValueChange?.(e.target.value)}
          disabled={disabled}
          required={required}
          onBlur={onBlur}
        >
          {placeholder && value === "" && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <span className={styles.nativeIcon}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path fill="currentColor" d="M2.5 4.5L6 8l3.5-3.5" />
          </svg>
        </span>
      </div>

      <div className={styles.radixWrapper}>
        <Select.Root
          value={value}
          onValueChange={onValueChange}
          name={name}
          disabled={disabled}
          required={required}
        >
          <Select.Trigger
            id={id}
            className={cx(styles.trigger, className)}
            aria-label={ariaLabel}
            onBlur={onBlur}
          >
            <Select.Value placeholder={placeholder} />
            <Select.Icon className={styles.icon}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                aria-hidden="true"
              >
                <path fill="currentColor" d="M2.5 4.5L6 8l3.5-3.5" />
              </svg>
            </Select.Icon>
          </Select.Trigger>

          <Select.Content
            className={styles.content}
            position="popper"
            sideOffset={4}
          >
            <Select.ScrollUpButton className={styles.scrollButton}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                aria-hidden="true"
              >
                <path fill="currentColor" d="M2.5 7.5L6 4l3.5 3.5" />
              </svg>
            </Select.ScrollUpButton>

            <Select.Viewport className={styles.viewport}>
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className={styles.item}
                  disabled={option.disabled}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>

            <Select.ScrollDownButton className={styles.scrollButton}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                aria-hidden="true"
              >
                <path fill="currentColor" d="M2.5 4.5L6 8l3.5-3.5" />
              </svg>
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Root>
      </div>
    </>
  );
}
