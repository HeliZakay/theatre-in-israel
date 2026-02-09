"use client";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import Link from "next/link";
import styles from "./Header.module.css";
import ROUTES from "@/constants/routes";
import Logo from "@/components/Logo/Logo";
import { usePathname } from "next/navigation";
import Button from "@/components/Button/Button";

export default function Header() {
  const pathname = usePathname();
  return (
    <header className={styles.header}>
      <Logo />

      <div className={styles.menu}>
        <NavigationMenu.Root>
          <NavigationMenu.List className={styles.navList}>
            <NavigationMenu.Item>
              <NavigationMenu.Link asChild active={pathname === "/"}>
                <Link href="/" className={styles.navText}>
                  עמוד הבית
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Link asChild active={pathname === "/shows"}>
                <Link href={ROUTES.SHOWS} className={styles.navText}>
                  כל ההצגות
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>

        <Button href="/reviews/new" aria-label="כתיבת ביקורת">
          לכתוב ביקורת
        </Button>
      </div>
    </header>
  );
}
