"use client";

import { useState, useCallback } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import styles from "./ShareDropdown.module.css";

interface ShareDropdownProps {
  url: string;
  title: string;
  theatre: string;
  className?: string;
}

export default function ShareDropdown({
  url,
  title,
  theatre,
  className,
}: ShareDropdownProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl =
    typeof window !== "undefined"
      ? new URL(url, window.location.origin).href
      : url;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: silently fail
    }
  }, [fullUrl]);

  const shareText = `🎭 ראיתם כבר את ״${title}״ ב${theatre}? בואו לקרוא ביקורות ולשתף את הדעה שלכם!`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${fullUrl}`)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className={className} aria-label="שיתוף">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={styles.icon}
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          שיתוף
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={styles.content}
          align="start"
          sideOffset={8}
        >
          <DropdownMenu.Item asChild className={styles.item}>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <span className={styles.whatsappDot} aria-hidden="true" />
              WhatsApp
            </a>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild className={styles.item}>
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
              <span className={styles.facebookDot} aria-hidden="true" />
              Facebook
            </a>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className={styles.item}
            onSelect={(e) => {
              e.preventDefault();
              handleCopy();
            }}
          >
            <span className={styles.copyDot} aria-hidden="true" />
            {copied ? "הועתק!" : "העתקת קישור"}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
