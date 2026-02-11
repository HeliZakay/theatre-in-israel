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
  disabled = false,
  required = false,
  onBlur,
}) {
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
