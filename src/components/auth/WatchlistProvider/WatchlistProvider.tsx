"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  addToWatchlistAction,
  removeFromWatchlistAction,
  getWatchlistIdsAction,
} from "@/lib/watchlistActions";

interface WatchlistContextValue {
  isInWatchlist: (showId: number) => boolean;
  toggle: (showId: number, showSlug: string) => void;
}

const WatchlistContext = createContext<WatchlistContextValue>({
  isInWatchlist: () => false,
  toggle: () => {},
});

export function useWatchlist() {
  return useContext(WatchlistContext);
}

export default function WatchlistProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [prevUser, setPrevUser] = useState(session?.user);

  if (session?.user !== prevUser) {
    setPrevUser(session?.user);
    if (!session?.user) {
      setIds(new Set());
    }
  }

  useEffect(() => {
    if (!session?.user) return;
    getWatchlistIdsAction().then((arr) => setIds(new Set(arr)));
  }, [session?.user]);

  const isInWatchlist = useCallback((showId: number) => ids.has(showId), [ids]);

  const toggle = useCallback(
    (showId: number, showSlug: string) => {
      if (!session) {
        router.push(
          `/auth/signin?callbackUrl=${encodeURIComponent(`/shows/${showSlug}`)}`,
        );
        return;
      }

      const wasIn = ids.has(showId);
      setIds((prev) => {
        const next = new Set(prev);
        if (wasIn) next.delete(showId);
        else next.add(showId);
        return next;
      });

      const action = wasIn
        ? removeFromWatchlistAction(showId)
        : addToWatchlistAction(showId);

      action.then((result) => {
        if (!result.success) {
          setIds((prev) => {
            const reverted = new Set(prev);
            if (wasIn) reverted.add(showId);
            else reverted.delete(showId);
            return reverted;
          });
        }
      });
    },
    [session, ids, router],
  );

  return (
    <WatchlistContext.Provider value={{ isInWatchlist, toggle }}>
      {children}
    </WatchlistContext.Provider>
  );
}
