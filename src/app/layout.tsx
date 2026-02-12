import "./globals.css";
import { Header, Footer } from "@/components";
import { Noto_Sans_Hebrew } from "next/font/google";
import RadixDirectionProvider from "@/components/RadixDirectionProvider/RadixDirectionProvider";
import ROUTES from "@/constants/routes";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  getMetadataBase,
  getSiteUrl,
  toAbsoluteUrl,
  toJsonLd,
} from "@/lib/seo";

import type { Metadata } from "next";

const textFont = Noto_Sans_Hebrew({
  subsets: ["hebrew", "latin"],
  variable: "--font-text",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: ROUTES.HOME,
  },
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={textFont.variable}>
        <RadixDirectionProvider dir="rtl">
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
          <div className="appContent">{children}</div>
          <Footer />
        </RadixDirectionProvider>
      </body>
    </html>
  );
}
