"use client";

import { useWatchlist } from "@/components/auth/WatchlistProvider/WatchlistProvider";
import { useToast } from "@/components/ui/Toast/ToastProvider";
import Tooltip from "@/components/ui/Tooltip/Tooltip";
import styles from "./WatchlistToggle.module.css";

interface WatchlistToggleProps {
  showId: number;
  showSlug: string;
  variant?: "default" | "inline";
  className?: string;
}

export default function WatchlistToggle({
  showId,
  showSlug,
  variant = "default",
  className,
}: WatchlistToggleProps) {
  const { isInWatchlist, toggle } = useWatchlist();
  const { showToast } = useToast();
  const active = isInWatchlist(showId);

  const tooltipText = active ? "הסר מרשימת צפייה" : "הוסף לרשימת צפייה";

  return (
    <Tooltip content={tooltipText}>
    <button
      type="button"
      className={[
        styles.toggle,
        variant === "inline" ? styles.inline : "",
        active ? styles.active : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        const wasActive = active;
        toggle(showId, showSlug);
        if (!wasActive) {
          showToast("נוסף לרשימה");
        }
      }}
      aria-label={active ? "הסר מרשימת צפייה" : "הוסף לרשימת צפייה"}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
    </Tooltip>
  );
}
