import Link from "next/link";
import styles from "./SectionHeader.module.css";

interface SectionHeaderProps {
  kicker?: string;
  title: string;
  linkHref?: string;
  linkText?: string;
  className?: string;
}

export default function SectionHeader({
  kicker,
  title,
  linkHref,
  linkText,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`${styles.header} ${className}`}>
      <div>
        {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
        <h2 className={styles.title}>{title}</h2>
      </div>
      {linkHref && linkText ? (
        <Link className={styles.link} href={linkHref}>
          {linkText}
        </Link>
      ) : null}
    </div>
  );
}
