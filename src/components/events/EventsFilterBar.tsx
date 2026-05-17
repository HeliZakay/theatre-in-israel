"use client";

import { useState, type ReactNode } from "react";
import styles from "./EventsFilterBar.module.css";

interface EventsFilterBarProps {
  basic: ReactNode;
  advanced: ReactNode;
  advancedActive: boolean;
  activeCount?: number;
}

export default function EventsFilterBar({
  basic,
  advanced,
  advancedActive,
  activeCount = 0,
}: EventsFilterBarProps) {
  const [open, setOpen] = useState(advancedActive);
  const showBadge = !open && activeCount > 0;

  return (
    <div className={styles.bar}>
      <div className={styles.basicRow}>
        {basic}
        <div className={styles.toggleRow}>
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={open}
            aria-controls="advanced-filters"
            onClick={() => setOpen((v) => !v)}
          >
            <span>{open ? "הסתר חיפוש מתקדם" : "חיפוש מתקדם"}</span>
            {showBadge && <span className={styles.badge}>{activeCount}</span>}
            <span
              className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
              aria-hidden="true"
            >
              ▾
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div
          id="advanced-filters"
          role="region"
          aria-label="חיפוש מתקדם"
          className={styles.advanced}
        >
          {advanced}
        </div>
      )}
    </div>
  );
}
