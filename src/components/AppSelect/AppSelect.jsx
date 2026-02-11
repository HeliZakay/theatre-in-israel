"use client";

import * as Select from "@radix-ui/react-select";
import styles from "./AppSelect.module.css";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
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
  contentClassName,
  disabled = false,
  required = false,
  onBlur,
}) {
  return (
    <Select.Root
      name={name}
      value={value || undefined}
      onValueChange={onValueChange}
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
        <Select.Icon className={styles.icon} aria-hidden>
          ▾
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className={cx(styles.content, contentClassName)}
          position="popper"
          sideOffset={6}
        >
          <Select.Viewport className={styles.viewport}>
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={styles.item}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className={styles.indicator}>
                  ✓
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
