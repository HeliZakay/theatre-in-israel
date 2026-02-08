"use client";

import { useRef } from "react";
import styles from "./ScrollRow.module.css";

export default function ScrollRow({ ariaLabel, children }) {
  const viewportRef = useRef(null);

  const scrollByAmount = (direction) => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const scrollAmount = viewport.clientWidth * 0.8;
    viewport.scrollBy({
      left: direction * scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className={styles.wrapper} aria-label={ariaLabel}>
      <button
        className={styles.button}
        type="button"
        onClick={() => scrollByAmount(1)}
        aria-label="גלילה שמאלה"
      >
        ‹
      </button>
      <div className={styles.viewport} ref={viewportRef}>
        {children}
      </div>
      <button
        className={styles.button}
        type="button"
        onClick={() => scrollByAmount(-1)}
        aria-label="גלילה ימינה"
      >
        ›
      </button>
    </div>
  );
}
