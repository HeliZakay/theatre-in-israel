"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { removeFromWatchlistAction } from "@/lib/watchlistActions";
import styles from "./page.module.css";

interface RemoveFromWatchlistButtonProps {
  showId: number;
}

export default function RemoveFromWatchlistButton({
  showId,
}: RemoveFromWatchlistButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setError(null);

    try {
      const result = await removeFromWatchlistAction(showId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setIsOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה בהסרת ההצגה");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!isDeleting) {
          setIsOpen(open);
          if (!open) setError(null);
        }
      }}
    >
      <AlertDialog.Trigger asChild>
        <button type="button" className={styles.removeBtn}>
          הסיר.י מהרשימה
        </button>
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className={styles.dialogOverlay} />
        <AlertDialog.Content className={styles.dialogContent}>
          <AlertDialog.Title className={styles.dialogTitle}>
            הסיר.י מרשימת הצפייה
          </AlertDialog.Title>
          <AlertDialog.Description className={styles.dialogDescription}>
            {error || "להסיר את ההצגה מרשימת הצפייה?"}
          </AlertDialog.Description>

          {error ? (
            <div className={styles.dialogActions}>
              <AlertDialog.Cancel asChild>
                <button type="button" className={styles.dialogCancel}>
                  סגירה
                </button>
              </AlertDialog.Cancel>
            </div>
          ) : (
            <div className={styles.dialogActions}>
              <AlertDialog.Cancel asChild>
                <button
                  type="button"
                  className={styles.dialogCancel}
                  disabled={isDeleting}
                >
                  ביטול
                </button>
              </AlertDialog.Cancel>
              <button
                type="button"
                className={styles.dialogConfirm}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "מסירים..." : "הסרה"}
              </button>
            </div>
          )}
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
