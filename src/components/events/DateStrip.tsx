"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import styles from "./DateStrip.module.css";

export interface DateTab {
  dateKey: string;
  dayName: string;   // e.g. "יום רביעי"
  dayNum: string;     // e.g. "18"
  monthName: string;  // e.g. "מרץ"
  label: string;      // e.g. "היום" | "מחר" | ""
  count: number;
}

interface DateStripProps {
  tabs: DateTab[];
  selected: string;
  onSelect: (dateKey: string) => void;
}

export default function DateStrip({ tabs, selected, onSelect }: DateStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // RTL: scrollLeft is negative in some browsers
    const sl = Math.abs(el.scrollLeft);
    setCanScrollRight(sl > 0);
    setCanScrollLeft(sl + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows]);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const offset = el.offsetLeft - container.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2;
      container.scrollTo({ left: offset, behavior: "smooth" });
    }
  }, [selected]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    // RTL: "left" visually means scrolling towards newer dates (positive scrollLeft in LTR)
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className={styles.wrapper}>
      {canScrollLeft && (
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowLeft}`}
          onClick={() => scroll("left")}
          aria-label="גלול קדימה"
        >
          ›
        </button>
      )}
      <div className={styles.strip} ref={scrollRef} role="tablist" aria-label="בחירת תאריך">
        {tabs.map((tab) => {
          const isActive = selected === tab.dateKey;
          return (
            <button
              key={tab.dateKey}
              role="tab"
              aria-selected={isActive}
              ref={isActive ? activeRef : undefined}
              className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
              onClick={() => onSelect(tab.dateKey)}
            >
              {tab.label && <span className={styles.tabBadge}>{tab.label}</span>}
              <span className={styles.tabDay}>{tab.dayName}</span>
              <span className={styles.tabNum}>{tab.dayNum}</span>
              <span className={styles.tabMonth}>{tab.monthName}</span>
            </button>
          );
        })}
      </div>
      {canScrollRight && (
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowRight}`}
          onClick={() => scroll("right")}
          aria-label="גלול אחורה"
        >
          ‹
        </button>
      )}
    </div>
  );
}
