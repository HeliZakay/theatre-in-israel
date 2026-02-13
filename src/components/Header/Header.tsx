"use client";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import styles from "./Header.module.css";
import ROUTES from "@/constants/routes";
import Logo from "@/components/Logo/Logo";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRef, useState } from "react";
import { useHeaderOffset } from "@/hooks/useHeaderOffset";
import DesktopNav from "./DesktopNav";
import MobileMenu from "./MobileMenu";

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const fullName = session?.user?.name?.trim() || "";
  const firstName = fullName.split(/\s+/).filter(Boolean)[0] || "";
  const isWriteReviewPage =
    pathname === ROUTES.REVIEWS_NEW || pathname.endsWith("/review");
  const isMyAreaPage =
    pathname === ROUTES.MY_REVIEWS ||
    pathname.startsWith(`${ROUTES.MY_REVIEWS}/`);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  const closeMenus = () => {
    setIsMobileMenuOpen(false);
  };

  useHeaderOffset(headerRef);

  const mobileMenuProps = {
    pathname,
    isAuthenticated,
    isLoading,
    fullName,
    firstName,
    isWriteReviewPage,
    isMyAreaPage,
    onClose: closeMenus,
  };

  return (
    <header className={styles.header} ref={headerRef}>
      <Logo />

      <Dialog.Root open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <div className={styles.topControls}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className={styles.menuToggle}
              aria-label={
                isMobileMenuOpen
                  ? "סגירת תפריט ניווט"
                  : "פתיחת תפריט ניווט"
              }
            >
              <svg
                viewBox="0 0 24 24"
                className={styles.menuToggleIcon}
                aria-hidden="true"
              >
                {isMobileMenuOpen ? (
                  <path
                    fill="currentColor"
                    d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z"
                  />
                ) : (
                  <path
                    fill="currentColor"
                    d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"
                  />
                )}
              </svg>
              <span className={styles.menuToggleLabel}>תפריט</span>
            </button>
          </Dialog.Trigger>
        </div>

        <Dialog.Portal>
          <Dialog.Overlay className={styles.mobileBackdrop} />
          <Dialog.Content
            className={styles.mobileDialogContent}
            aria-label="תפריט ניווט"
          >
            <VisuallyHidden.Root>
              <Dialog.Title>תפריט ניווט</Dialog.Title>
            </VisuallyHidden.Root>
            <DesktopNav pathname={pathname} onNavigate={closeMenus} />
            <MobileMenu {...mobileMenuProps} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Desktop-only nav (hidden on mobile via CSS) */}
      <div className={styles.menu}>
        <DesktopNav pathname={pathname} onNavigate={closeMenus} />
        <MobileMenu {...mobileMenuProps} />
      </div>
    </header>
  );
}
