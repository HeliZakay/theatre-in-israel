"use client";

import { useWatchlist } from "@/components/auth/WatchlistProvider/WatchlistProvider";
import { useToast } from "@/components/ui/Toast/ToastProvider";
import styles from "./WatchlistButton.module.css";

interface WatchlistButtonProps {
  showId: number;
  showSlug: string;
}

export default function WatchlistButton({
  showId,
  showSlug,
}: WatchlistButtonProps) {
  const { isInWatchlist, toggle } = useWatchlist();
  const { showToast } = useToast();
  const inWatchlist = isInWatchlist(showId);

  const className = [styles.button, inWatchlist ? styles.active : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={className}
      onClick={() => {
        const wasIn = inWatchlist;
        toggle(showId, showSlug);
        if (!wasIn) {
          showToast("נוסף לרשימה");
        }
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={inWatchlist ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={styles.icon}
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {inWatchlist ? "ברשימת הצפייה" : "הוסיפ.י לרשימת צפייה"}
    </button>
  );
}
