"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./page.module.css";

interface DeleteReviewButtonProps {
  reviewId: number;
}

export default function DeleteReviewButton({
  reviewId,
}: DeleteReviewButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;
    const shouldDelete = window.confirm("למחוק את הביקורת?");
    if (!shouldDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json?.error || "לא הצלחנו למחוק את הביקורת");
        return;
      }
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "שגיאה במחיקת הביקורת");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      className={styles.deleteBtn}
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? "מוחקים..." : "מחיקה"}
    </button>
  );
}
