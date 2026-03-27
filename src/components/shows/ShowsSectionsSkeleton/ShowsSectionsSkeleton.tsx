import styles from "./ShowsSectionsSkeleton.module.css";

const SECTION_COUNT = 5;
const CARD_COUNT = 5;

export default function ShowsSectionsSkeleton() {
  return (
    <div className={styles.wrapper} aria-busy="true" aria-label="טוען הצגות…">
      {Array.from({ length: SECTION_COUNT }).map((_, sectionIndex) => (
        <div key={sectionIndex} className={styles.section}>
          <div className={styles.headerRow}>
            <div className={styles.kicker} />
            <div className={styles.title} />
          </div>
          <div className={styles.carousel}>
            {Array.from({ length: CARD_COUNT }).map((_, cardIndex) => (
              <div key={cardIndex} className={styles.card}>
                <div className={styles.thumb} />
                <div className={styles.body}>
                  <div className={styles.line} />
                  <div className={styles.lineShort} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
