import styles from "./Tag.module.css";
import { cx } from "@/utils/cx";

interface TagProps {
  children: React.ReactNode;
  className?: string;
}

export default function Tag({ children, className = "" }: TagProps) {
  return <span className={cx(styles.tag, className)}>{children}</span>;
}
