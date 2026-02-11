import Link from "next/link";
import styles from "./BackLink.module.css";

interface BackLinkProps {
  href?: string;
  children?: React.ReactNode;
}

export default function BackLink({ href = "/", children }: BackLinkProps) {
  return (
    <Link className={styles.backLink} href={href}>
      {children ?? "חזרה לעמוד הבית →"}
    </Link>
  );
}
