import styles from "./Tag.module.css";

export default function Tag({ children, className = "" }) {
  return <span className={`${styles.tag} ${className}`}>{children}</span>;
}
