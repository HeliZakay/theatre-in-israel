import { toJsonLd } from "@/lib/seo";
import styles from "./EventsFAQ.module.css";

const FAQ_ITEMS = [
  {
    question: "אילו הצגות מומלצות לראות עכשיו?",
    answer:
      "בעמוד הראשי של תיאטרון בישראל תמצאו את ההצגות בעלות הדירוג הגבוה ביותר על בסיס ביקורות צופים אמיתיים. הדירוגים מתעדכנים בזמן אמת ומשקפים את חוויות הקהל.",
  },
  {
    question: "איך מוצאים הצגות תיאטרון לסוף השבוע?",
    answer:
      'בלוח ההצגות ניתן לסנן לפי "סוף השבוע" כדי לראות את כל ההופעות הקרובות. אפשר גם לסנן לפי אזור — צפון, מרכז, דרום, ירושלים — כדי למצוא הצגות קרובות אליכם.',
  },
  {
    question: "איך בוחרים הצגה לילדים?",
    answer:
      "בעמוד ההצגות ניתן לסנן לפי ז׳אנר ולבחור הצגות ילדים. לכל הצגה מופיעים ביקורות וציון ממוצע של צופים, כך שקל לבחור הצגה שמתאימה למשפחה.",
  },
  {
    question: "אילו תיאטראות פעילים בישראל?",
    answer:
      "האתר מרכז מידע מתיאטראות מובילים בכל הארץ — הקאמרי, הבימה, גשר, תיאטרון חיפה, באר שבע, החאן, בית ליסין, תמונע, צוותא, התיאטרון העברי ועוד. בנוסף יש מידע על היכלי תרבות מרחבי הארץ.",
  },
  {
    question: "איפה קונים כרטיסים להצגות?",
    answer:
      "האתר לא מוכר כרטיסים אלא עוזר לכם לבחור מה לראות. לרכישת כרטיסים, חפשו את שם ההצגה באתר התיאטרון או היכל התרבות המפיק.",
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
