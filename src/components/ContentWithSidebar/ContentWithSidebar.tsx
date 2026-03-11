import styles from "./ContentWithSidebar.module.css";

interface ContentWithSidebarProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

export default function ContentWithSidebar({
  children,
  sidebar,
}: ContentWithSidebarProps) {
  return (
    <div className={styles.grid}>
      <div className={styles.main}>{children}</div>
      <aside className={styles.sidebar}>{sidebar}</aside>
    </div>
  );
}
