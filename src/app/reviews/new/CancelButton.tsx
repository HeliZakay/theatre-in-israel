"use client";

import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function CancelButton() {
  const router = useRouter();

  return (
    <div className={styles.cancelLink}>
      <button
        className={styles.ghostBtn}
        type="button"
        onClick={() => router.back()}
      >
        ביטול
      </button>
    </div>
  );
}
