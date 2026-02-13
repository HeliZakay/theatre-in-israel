"use client";
import styles from "./Header.module.css";
import ROUTES from "@/constants/routes";
import Logo from "@/components/Logo/Logo";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
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
  const mobileMenuId = "header-mobile-menu";

  const closeMenus = () => {
    setIsMobileMenuOpen(false);
  };

  useHeaderOffset(headerRef);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className={styles.header} ref={headerRef}>
      <Logo />
      <div className={styles.topControls}>
        <button
          type="button"
          className={styles.menuToggle}
          aria-label={
            isMobileMenuOpen ? "סגירת תפריט ניווט" : "פתיחת תפריט ניווט"
          }
          aria-controls={mobileMenuId}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
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
      </div>

      {isMobileMenuOpen && (
        <div
          className={styles.mobileBackdrop}
          role="presentation"
          aria-hidden="true"
          onClick={closeMenus}
        />
      )}

      <div
        id={mobileMenuId}
        className={`${styles.menu} ${isMobileMenuOpen ? styles.menuOpen : ""}`}
        aria-label="תפריט ניווט"
      >
        <DesktopNav pathname={pathname} onNavigate={closeMenus} />

        <MobileMenu
          isOpen={isMobileMenuOpen}
          pathname={pathname}
          isAuthenticated={isAuthenticated}
          isLoading={isLoading}
          fullName={fullName}
          firstName={firstName}
          isWriteReviewPage={isWriteReviewPage}
          isMyAreaPage={isMyAreaPage}
          onClose={closeMenus}
        />
      </div>
    </header>
  );
}
