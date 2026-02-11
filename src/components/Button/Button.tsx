import Link from "next/link";
import styles from "./Button.module.css";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  [key: string]: unknown;
}

export default function Button({
  children,
  className = "",
  href,
  disabled = false,
  type,
  ...props
}: ButtonProps) {
  if (href) {
    if (disabled) {
      return (
        <span
          className={`${styles.button} ${className}`}
          aria-disabled="true"
          role="link"
          tabIndex={-1}
        >
          {children}
        </span>
      );
    }

    return (
      <Link href={href} className={`${styles.button} ${className}`} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={`${styles.button} ${className}`}
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
