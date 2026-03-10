"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import styles from "./ShowComboboxSheet.module.css";
import { cx } from "@/utils/cx";
import type { SelectOption } from "@/types";

const MAX_ITEMS = 50;

interface ShowComboboxSheetProps {
  options: SelectOption[];
  value: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  id?: string;
  invalid?: boolean;
  ariaDescribedBy?: string;
}

export default function ShowComboboxSheet({
  options,
  value,
  onValueChange,
  placeholder = "חפש.י הצגה…",
  id,
  invalid = false,
  ariaDescribedBy,
}: ShowComboboxSheetProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  // Reset search text when sheet opens
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset ephemeral UI state when sheet opens
      setSearch("");
      // Focus the search input after the sheet animates in
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [open]);

  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();
    const unique = Array.from(new Set(options.filter((o) => Boolean(o.label))));
    if (!query) return unique.slice(0, MAX_ITEMS);
    return unique
      .filter((o) => o.label.toLowerCase().includes(query))
      .slice(0, MAX_ITEMS);
  }, [options, search]);

  const handleSelect = useCallback(
    (option: SelectOption) => {
      onValueChange?.(option.value);
      setOpen(false);
    },
    [onValueChange],
  );

  return (
    <>
      {/* Trigger — styled to look like the regular combobox input */}
      <button
        type="button"
        id={id}
        className={cx(styles.trigger, invalid && styles.triggerInvalid)}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid}
        aria-describedby={ariaDescribedBy}
      >
        <span
          className={
            selectedLabel ? styles.triggerValue : styles.triggerPlaceholder
          }
        >
          {selectedLabel || placeholder}
        </span>
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content
            className={styles.content}
            aria-label="בחירת הצגה"
            onOpenAutoFocus={(e) => {
              // We handle focus ourselves
              e.preventDefault();
            }}
          >
            <VisuallyHidden.Root>
              <Dialog.Title>בחירת הצגה</Dialog.Title>
            </VisuallyHidden.Root>
            <Dialog.Description className={styles.srOnly}>
              חפשו הצגה מהרשימה
            </Dialog.Description>

            {/* Header with search input and close button */}
            <div className={styles.header}>
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder={placeholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <Dialog.Close className={styles.closeButton} aria-label="סגירה">
                ✕
              </Dialog.Close>
            </div>

            {/* Scrollable options list */}
            <ul role="listbox" className={styles.list}>
              {filteredItems.length === 0 ? (
                <li className={styles.empty}>לא נמצאו תוצאות</li>
              ) : (
                filteredItems.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      className={cx(
                        styles.option,
                        isSelected && styles.optionSelected,
                      )}
                      onClick={() => handleSelect(option)}
                    >
                      {option.label}
                    </li>
                  );
                })
              )}
            </ul>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
