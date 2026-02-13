"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import styles from "./page.module.css";

interface DeleteReviewButtonProps {
  reviewId: number;
}

export default function DeleteReviewButton({
  reviewId,
}: DeleteReviewButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.error || "לא הצלחנו למחוק את הביקורת");
        return;
      }
      setIsOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה במחיקת הביקורת");
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
        <button type="button" className={styles.deleteBtn}>
          מחיקה
        </button>
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className={styles.dialogOverlay} />
        <AlertDialog.Content className={styles.dialogContent}>
          <AlertDialog.Title className={styles.dialogTitle}>
            מחיקת ביקורת
          </AlertDialog.Title>
          <AlertDialog.Description className={styles.dialogDescription}>
            {error || "למחוק את הביקורת? לא ניתן לשחזר פעולה זו."}
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
                {isDeleting ? "מוחקים..." : "מחיקה"}
              </button>
            </div>
          )}
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
