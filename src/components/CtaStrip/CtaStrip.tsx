import Button from "@/components/Button/Button";
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
      <Button href={href} className={styles.button}>
        {buttonText}
      </Button>
    </section>
  );
}
