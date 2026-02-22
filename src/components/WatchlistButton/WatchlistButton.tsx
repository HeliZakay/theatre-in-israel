"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  addToWatchlistAction,
  removeFromWatchlistAction,
} from "@/lib/watchlistActions";
import styles from "./WatchlistButton.module.css";

interface WatchlistButtonProps {
  showId: number;
  showSlug: string;
  initialInWatchlist: boolean;
}

export default function WatchlistButton({
  showId,
  showSlug,
  initialInWatchlist,
}: WatchlistButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!session) {
      router.push(
        `/auth/signin?callbackUrl=${encodeURIComponent(`/shows/${showSlug}`)}`,
      );
      return;
    }

    const previous = inWatchlist;
    setInWatchlist(!previous);
    setLoading(true);

    try {
      const result = previous
        ? await removeFromWatchlistAction(showId)
        : await addToWatchlistAction(showId);

      if (!result.success) {
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
