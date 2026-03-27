"use client";

import { useWatchlist } from "@/components/auth/WatchlistProvider/WatchlistProvider";
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
  const inWatchlist = isInWatchlist(showId);

  const className = [styles.button, inWatchlist ? styles.active : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={className} onClick={() => toggle(showId, showSlug)}>
      {inWatchlist ? "ברשימת הצפייה ✓" : "הוסיפ.י לרשימת צפייה"}
    </button>
  );
}
