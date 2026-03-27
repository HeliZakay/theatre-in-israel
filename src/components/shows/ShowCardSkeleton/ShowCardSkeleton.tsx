import styles from "./ShowCardSkeleton.module.css";

export default function ShowCardSkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={styles.image} />
      <div>
        <div className={styles.titleBar} />
        <div className={styles.theatreBar} style={{ marginTop: 6 }} />
      </div>
      <div className={styles.metaBar} />
      <div className={styles.summaryBar} />
      <div className={styles.summaryBar2} />
      <div className={styles.genreRow}>
        <div className={styles.genreChip} />
        <div className={styles.genreChip} />
        <div className={styles.genreChip} />
      </div>
      <div className={styles.ratingBar} />
    </div>
  );
}
