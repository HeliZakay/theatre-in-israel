"use client";

import { useEffect, useState } from "react";
import styles from "./Toast.module.css";

interface ToastProps {
  message: string;
  action?: { label: string; onClick: () => void };
  onDismiss: () => void;
}

export default function Toast({ message, action, onDismiss }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setExiting(true), 2600);
    const removeTimer = setTimeout(onDismiss, 3000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onDismiss]);

  return (
    <div
      className={`${styles.toast} ${exiting ? styles.exit : ""}`}
      role="status"
    >
      <span>{message}</span>
      {action && (
        <button
          type="button"
          className={styles.action}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
