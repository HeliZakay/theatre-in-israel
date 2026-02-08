import Link from "next/link";
import styles from "./BackLink.module.css";

export default function BackLink({ href = "/", children }) {
  return (
    <Link className={styles.backLink} href={href}>
      {children ?? "חזרה לעמוד הבית →"}
    </Link>
  );
}
