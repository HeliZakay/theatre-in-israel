"use client";

import { useState, useCallback } from "react";
import styles from "./ShareButtons.module.css";

interface ShareButtonsProps {
  text: string;
  url: string;
}

export default function ShareButtons({ text, url }: ShareButtonsProps) {
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

  const handleNativeShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text, url: fullUrl });
      } catch {
        // User cancelled
      }
    }
  }, [text, fullUrl]);

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${fullUrl}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(fullUrl)}`;

  const canNativeShare =
    typeof navigator !== "undefined" && "share" in navigator;

  return (
    <div className={styles.container}>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.whatsapp}
        aria-label="שתפ.י בוואטסאפ"
      >
        WhatsApp
      </a>

      <button
        type="button"
        onClick={handleCopy}
        className={styles.copy}
        aria-label="העתקת קישור"
      >
        {copied ? "הועתק!" : "העתקת קישור"}
      </button>

      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.twitter}
        aria-label="שתפ.י ב-X"
      >
        X
      </a>

      {canNativeShare && (
        <button
          type="button"
          onClick={handleNativeShare}
          className={styles.native}
          aria-label="שיתוף"
        >
          שיתוף
        </button>
      )}
    </div>
  );
}
