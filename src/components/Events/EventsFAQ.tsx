import { toJsonLd } from "@/lib/seo";
import styles from "./EventsFAQ.module.css";

const FAQ_ITEMS = [
  {
    question: "איך אני יודע מה שווה לראות?",
    answer:
      "לכל הצגה בלוח ההופעות מופיע דירוג ממוצע על בסיס ביקורות צופים. לחצו על שם ההצגה כדי לקרוא ביקורות מלאות ולהחליט בעצמכם.",
  },
  {
    question: "איפה קונים כרטיסים?",
    answer:
      "כרגע האתר לא מוכר כרטיסים — לחצו על שם ההצגה כדי לראות פרטים נוספים ולמצוא קישורים לרכישה באתרי התיאטרון.",
  },
  {
    question: "מה זה תיאטרון בישראל?",
    answer:
      "תיאטרון בישראל הוא אתר ביקורות והמלצות קהל להצגות תיאטרון. אנחנו אוספים מידע על הופעות מכל התיאטראות בארץ ומאפשרים לצופים לשתף חוויות ולעזור לאחרים לבחור מה לראות.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default function EventsFAQ() {
  return (
    <section className={styles.faq}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(faqJsonLd) }}
      />
      <h2 className={styles.heading}>שאלות נפוצות</h2>
      {FAQ_ITEMS.map((item) => (
        <details key={item.question} className={styles.item}>
          <summary className={styles.summary}>{item.question}</summary>
          <p className={styles.answer}>{item.answer}</p>
        </details>
      ))}
    </section>
  );
}
