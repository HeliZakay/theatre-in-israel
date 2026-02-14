"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./WatchlistButton.module.css";

interface WatchlistButtonProps {
  showId: number;
  initialInWatchlist: boolean;
}

export default function WatchlistButton({
  showId,
  initialInWatchlist,
}: WatchlistButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!session) {
      router.push(
        `/auth/signin?callbackUrl=${encodeURIComponent(`/shows/${showId}`)}`,
      );
      return;
    }

    const previous = inWatchlist;
    setInWatchlist(!previous);
    setLoading(true);

    try {
      const res = previous
        ? await fetch(`/api/watchlist/${showId}`, { method: "DELETE" })
        : await fetch("/api/watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ showId }),
          });

      if (!res.ok) {
        setInWatchlist(previous);
      }
    } catch {
      setInWatchlist(previous);
    } finally {
      setLoading(false);
    }
  }

  const className = [styles.button, inWatchlist ? styles.active : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={className} onClick={handleClick} disabled={loading}>
      {loading ? "..." : inWatchlist ? "ברשימת הצפייה ✓" : "הוספה לרשימת צפייה"}
    </button>
  );
}
