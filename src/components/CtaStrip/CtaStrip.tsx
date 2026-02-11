import Link from "next/link";
import styles from "./CtaStrip.module.css";

interface CtaStripProps {
  title: string;
  text?: string;
  buttonText: string;
  href: string;
}

export default function CtaStrip({
  title,
  text,
  buttonText,
  href,
}: CtaStripProps) {
  return (
    <section className={styles.strip}>
      <div>
        <h2 className={styles.title}>{title}</h2>
        {text && <p className={styles.text}>{text}</p>}
      </div>
      <Link className={styles.button} href={href}>
        {buttonText}
      </Link>
    </section>
  );
}
