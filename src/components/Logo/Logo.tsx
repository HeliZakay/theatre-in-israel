import Link from "next/link";
import styles from "./Logo.module.css";
import Image from "next/image";
import { titleFont } from "@/lib/fonts";

export default function Logo() {
  return (
    <Link href="/" aria-label="דף הבית" className={styles.logo}>
      <Image
        src="/logo-img.png"
        alt=""
        className={styles.logoIcon}
        width={85}
        height={60}
      />

      <span className={styles.logoTextWrapper}>
        <span className={`${styles.logoTitle} ${titleFont.variable}`}>
          תיאטרון בישראל
        </span>
        <span className={styles.logoSubtitle}>פורטל ביקורות להצגות</span>
      </span>
    </Link>
  );
}
