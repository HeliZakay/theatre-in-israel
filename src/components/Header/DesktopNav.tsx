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
            <NavigationMenu.Link asChild active={pathname === ROUTES.SHOWS}>
              <Link
                href={ROUTES.SHOWS}
                className={styles.navText}
                onClick={onNavigate}
              >
                כל ההצגות
              </Link>
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu.Root>
    </div>
  );
}
