import styles from "./AppSelect.module.css";
import type { SelectOption } from "@/types";

function cx(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

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
    <select
      id={id}
      name={name}
      className={cx(styles.select, className)}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      disabled={disabled}
      required={required}
      onBlur={onBlur}
    >
      {placeholder && !value ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
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
  );
}
