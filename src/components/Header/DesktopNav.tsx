import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import Link from "next/link";
import styles from "./Header.module.css";
import ROUTES from "@/constants/routes";
import { cx } from "@/utils/cx";

interface DesktopNavProps {
  pathname: string;
  onNavigate: () => void;
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function DesktopNav({ pathname, onNavigate }: DesktopNavProps) {
  const isBrowseActive = [
    ROUTES.THEATRES,
    ROUTES.GENRES,
    ROUTES.CITIES,
    ROUTES.ACTORS,
  ].some((r) => pathname.startsWith(r));

  return (
    <div className={styles.navSection}>
      <NavigationMenu.Root className={styles.navRoot}>
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
                className={cx(styles.navText, styles.navTextPrimary)}
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
                className={cx(styles.navText, styles.navTextPrimary)}
                onClick={onNavigate}
              >
                קטלוג הצגות
              </Link>
            </NavigationMenu.Link>
          </NavigationMenu.Item>

          {/* Browse dropdown — groups taxonomy pages */}
          <NavigationMenu.Item>
            <NavigationMenu.Trigger
              className={cx(
                styles.navText,
                styles.browseMenuTrigger,
                isBrowseActive && styles.navTextActive,
              )}
            >
              עיון
              <ChevronDownIcon className={styles.browseChevron} />
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className={styles.browseMenuContent}>
              <Link
                href={ROUTES.THEATRES}
                className={styles.browseMenuItem}
                onClick={onNavigate}
              >
                תיאטראות
              </Link>
              <Link
                href={ROUTES.GENRES}
                className={styles.browseMenuItem}
                onClick={onNavigate}
              >
                ז׳אנרים
              </Link>
              <Link
                href={ROUTES.CITIES}
                className={styles.browseMenuItem}
                onClick={onNavigate}
              >
                ערים
              </Link>
              <Link
                href={ROUTES.ACTORS}
                className={styles.browseMenuItem}
                onClick={onNavigate}
              >
                שחקנים
              </Link>
            </NavigationMenu.Content>
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
