import Link from "next/link";
import styles from "./Button.module.css";
import { cx } from "@/utils/cx";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler;
  "aria-label"?: string;
}

export default function Button({
  children,
  className = "",
  href,
  disabled = false,
  type,
  onClick,
  ...props
}: ButtonProps) {
  if (href) {
    if (disabled) {
      return (
        <span
          className={cx(styles.button, className)}
          aria-disabled="true"
          role="link"
          tabIndex={-1}
        >
          {children}
        </span>
      );
    }

    return (
      <Link
        href={href}
        className={cx(styles.button, className)}
        onClick={onClick}
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      className={cx(styles.button, className)}
      disabled={disabled}
      type={type}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
