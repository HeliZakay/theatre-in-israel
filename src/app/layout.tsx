import "./globals.css";
import Header from "@/components/layout/Header/Header";
import Footer from "@/components/layout/Footer/Footer";
import { Noto_Sans_Hebrew } from "next/font/google";
import RadixDirectionProvider from "@/components/layout/RadixDirectionProvider/RadixDirectionProvider";
import AuthSessionProvider from "@/components/auth/AuthSessionProvider/AuthSessionProvider";
import WatchlistProvider from "@/components/auth/WatchlistProvider/WatchlistProvider";
import ScrollToTop from "@/components/layout/ScrollToTop/ScrollToTop";
import SecurityBanner from "@/components/layout/SecurityBanner/SecurityBanner";
import TooltipProvider from "@/components/ui/Tooltip/TooltipProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ROUTES from "@/constants/routes";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  getMetadataBase,
  getSiteUrl,
  toAbsoluteUrl,
  toJsonLd,
} from "@/lib/seo";

import type { Metadata, Viewport } from "next";

const textFont = Noto_Sans_Hebrew({
  subsets: ["hebrew", "latin"],
  variable: "--font-text",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a1a2e",
};

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: ROUTES.HOME,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/logo-img.png",
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/logo-img.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: "hqBESqqSA6b6XJekw6dY_3RlEEWOt3z9u3SNmMbuED0",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: siteUrl,
  inLanguage: "he-IL",
  description: SITE_DESCRIPTION,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}${ROUTES.SHOWS}?query={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: siteUrl,
  logo: toAbsoluteUrl("/logo-img.png"),
  sameAs: ["https://www.facebook.com/groups/965299379184440"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={textFont.variable}>
        <ScrollToTop />
        <AuthSessionProvider>
          <WatchlistProvider>
          <RadixDirectionProvider dir="rtl">
          <TooltipProvider>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: toJsonLd(websiteJsonLd) }}
            />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: toJsonLd(organizationJsonLd) }}
            />
            <a href="#main-content" className="skipLink">
              דלג לתוכן הראשי
            </a>
            <Header />
            <SecurityBanner />
            <div className="appContent">{children}</div>
            <Footer />
          </TooltipProvider>
          </RadixDirectionProvider>
          </WatchlistProvider>
        </AuthSessionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
