"use client";

import { useCallback, useRef } from "react";
import { EXPRESSION_CHIPS } from "@/constants/expressionChips";
import styles from "./ExpressionChips.module.css";
import { cx } from "@/utils/cx";

interface ExpressionChipsProps {
  text: string;
  onTextChange: (text: string) => void;
  disabled?: boolean;
}

function parseChips(text: string): Set<string> {
  return new Set(
    text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export default function ExpressionChips({
  text,
  onTextChange,
  disabled = false,
}: ExpressionChipsProps) {
  const activeChips = parseChips(text);

  const toolbarRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(
    (chip: string) => {
      if (disabled) return;
      const chips = parseChips(text);
      if (chips.has(chip)) {
        chips.delete(chip);
      } else {
        chips.add(chip);
      }
      onTextChange(Array.from(chips).join(", "));
    },
    [text, onTextChange, disabled],
  );

  /** Roving tabindex for toolbar: arrow keys navigate between chips. */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const { key } = e;
    if (key !== "ArrowRight" && key !== "ArrowLeft") return;

    const buttons = toolbarRef.current?.querySelectorAll<HTMLButtonElement>(
      "button:not(:disabled)",
    );
    if (!buttons?.length) return;

    const items = Array.from(buttons);
    const idx = items.indexOf(e.target as HTMLButtonElement);
    if (idx === -1) return;

    e.preventDefault();
    // RTL: ArrowRight = previous, ArrowLeft = next
    const next = key === "ArrowRight" ? idx - 1 : idx + 1;
    if (next >= 0 && next < items.length) {
      items[idx].setAttribute("tabindex", "-1");
      items[next].setAttribute("tabindex", "0");
      items[next].focus();
    }
  }, []);

  return (
    <div className={styles.chipWrapper}>
      <p className={styles.optionalHint}>
        אפשר לבחור תגיות במקום לכתוב
      </p>
    <div
      ref={toolbarRef}
      className={styles.chipRow}
      role="toolbar"
      aria-label="ביטויים מוצעים"
      onKeyDown={handleKeyDown}
    >
      {EXPRESSION_CHIPS.map((chip, i) => {
        const isActive = activeChips.has(chip);
        return (
          <button
            key={chip}
            type="button"
            className={cx(styles.chip, isActive && styles.chipActive)}
            aria-pressed={isActive}
            tabIndex={i === 0 ? 0 : -1}
            disabled={disabled}
            onClick={() => handleToggle(chip)}
          >
            {chip}
          </button>
        );
      })}
    </div>
    </div>
  );
}
