"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { isLotteryActive } from "@/constants/lottery";
import { cx } from "@/utils/cx";
import styles from "./StickyReviewCTA.module.css";

const DISMISS_KEY = "stickyReviewCTA_dismissed";

interface StickyReviewCTAProps {
  href?: string;
}

export default function StickyReviewCTA({ href }: StickyReviewCTAProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [formInView, setFormInView] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    setDismissed(false);
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const target = document.getElementById("hero-actions");
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [dismissed]);

  useEffect(() => {
    if (dismissed) return;
    const form = document.getElementById("write-review");
    if (!form) return;

    const observer = new IntersectionObserver(
      ([entry]) => setFormInView(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(form);
    return () => observer.disconnect();
  }, [dismissed]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }, []);

  const lottery = useMemo(() => isLotteryActive(), []);

  if (dismissed) return null;

  return (
    <div
      className={cx(
        styles.bar,
        visible && !formInView && styles.barVisible,
        lottery ? styles.barLottery : styles.barDefault,
      )}
      role="complementary"
      aria-label={lottery ? "הגרלת כרטיסים" : "כתיבת ביקורת"}
    >
      <span className={styles.text}>
        {lottery
          ? "🎟️ כתב.י ביקורת ואולי תזכ.י בכרטיסים!"
          : "ראיתם את ההצגה? ספרו מה חשבתם"}
      </span>
      {href ? (
        <Link href={href} className={styles.cta}>
          כתב.י ביקורת
        </Link>
      ) : (
        <a
          href="#write-review"
          className={styles.cta}
          onClick={(e) => {
            e.preventDefault();
            document
              .getElementById("write-review")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          כתב.י ביקורת
        </a>
      )}
      <button
        type="button"
        className={styles.close}
        onClick={handleDismiss}
        aria-label="סגירה"
      >
        ×
      </button>
    </div>
  );
}
