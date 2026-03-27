import styles from "./WebReviewSummary.module.css";

interface WebReviewSummaryProps {
  summary: string | null;
}

export default function WebReviewSummary({ summary }: WebReviewSummaryProps) {
  if (!summary) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>סקירת ביקורות חיצוניות</h2>
      <p className={styles.text}>{summary}</p>
    </section>
  );
}
