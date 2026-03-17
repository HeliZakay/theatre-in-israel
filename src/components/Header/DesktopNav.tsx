import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import Link from "next/link";
import styles from "./Header.module.css";
import ROUTES from "@/constants/routes";

interface DesktopNavProps {
  pathname: string;
  onNavigate: () => void;
}

export default function DesktopNav({ pathname, onNavigate }: DesktopNavProps) {
  return (
    <div className={styles.navSection}>
      <NavigationMenu.Root>
        <NavigationMenu.List className={styles.navList}>
          <NavigationMenu.Item>
            <NavigationMenu.Link asChild active={pathname === "/"}>
              <Link href="/" className={styles.navText} onClick={onNavigate}>
                עמוד הבית
              </Link>
            </NavigationMenu.Link>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Link
              asChild
              active={pathname.startsWith(ROUTES.EVENTS)}
            >
              <Link
                href={ROUTES.EVENTS}
                className={styles.navText}
                onClick={onNavigate}
              >
                לוח הופעות
              </Link>
            </NavigationMenu.Link>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Link asChild active={pathname === ROUTES.SHOWS}>
              <Link
                href={ROUTES.SHOWS}
                className={styles.navText}
                onClick={onNavigate}
              >
                קטלוג הצגות
              </Link>
            </NavigationMenu.Link>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Link
              asChild
              active={pathname.startsWith(ROUTES.THEATRES)}
            >
              <Link
                href={ROUTES.THEATRES}
                className={styles.navText}
                onClick={onNavigate}
              >
                תיאטראות
              </Link>
            </NavigationMenu.Link>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Link asChild active={pathname === ROUTES.CONTACT}>
              <Link
                href={ROUTES.CONTACT}
                className={styles.navText}
                onClick={onNavigate}
              >
                צר.י קשר
              </Link>
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu.Root>
    </div>
  );
}
