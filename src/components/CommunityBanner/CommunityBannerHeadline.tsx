"use client";

import { useSession } from "next-auth/react";
import styles from "./CommunityBanner.module.css";

export default function CommunityBannerHeadline() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <>
      <h2 className={styles.headline}>
        {isAuthenticated ? "שמחים שאתם חלק מהקהילה" : "בואו להיות חלק מהקהילה"}
      </h2>
      <p className={styles.body}>
        {isAuthenticated
          ? "יש הצגה שרציתם לספר עליה? כל מילה עוזרת לאוהבי תיאטרון לבחור את ההצגה הבאה שלהם."
          : "כתבו ביקורת קצרה על הצגה שראיתם — כל מילה עוזרת לאוהבי תיאטרון לבחור את ההצגה הבאה שלהם."}
      </p>
    </>
  );
}
