import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getActorData } from "@/lib/data/actorDetail";
import { ACTORS, ACTOR_BY_SLUG } from "@/constants/actors";
import { THEATRE_BY_NAME } from "@/constants/theatres";
import ROUTES, { actorPath, showPath, theatrePath } from "@/constants/routes";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import ShowCard from "@/components/ShowCard/ShowCard";
import {
  SITE_NAME,
  buildBreadcrumbJsonLd,
  toAbsoluteUrl,
  toJsonLd,
} from "@/lib/seo";
import styles from "./page.module.css";

import type { Metadata } from "next";

export const revalidate = 120;

export function generateStaticParams() {
  return ACTORS.map((a) => ({ slug: a.slug }));
}

interface ActorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ActorPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const actor = ACTOR_BY_SLUG.get(slug);
  if (!actor) {
    return { title: "שחקן/ית לא נמצא/ה", robots: { index: false } };
  }

  const { stats } = await getActorData(actor.name);
  const canonicalPath = actorPath(slug);

  const ratingText =
    stats.avgRating !== null
      ? ` ★ ${stats.avgRating.toFixed(1)}/5 על בסיס ${stats.totalReviews} ביקורות.`
      : "";

  const title = `${actor.name} — הצגות וביקורות`;
  const description = `${stats.showCount} הצגות עם ${actor.name} על הבמה הישראלית.${ratingText}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: toAbsoluteUrl(canonicalPath),
      images: [{ url: toAbsoluteUrl(actor.image), alt: actor.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [toAbsoluteUrl(actor.image)],
    },
  };
}

export default async function ActorDetailPage({ params }: ActorPageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const actor = ACTOR_BY_SLUG.get(slug);
  if (!actor) notFound();

  const { shows, stats } = await getActorData(actor.name);
  const canonicalPath = actorPath(slug);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "עמוד הבית", path: ROUTES.HOME },
    { name: "שחקנים", path: ROUTES.ACTORS },
    { name: actor.name, path: canonicalPath },
  ]);

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: actor.name,
    image: toAbsoluteUrl(actor.image),
    url: toAbsoluteUrl(canonicalPath),
  };

  const itemListJsonLd =
    shows.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `הצגות של ${actor.name}`,
          itemListElement: shows.map((show, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: show.title,
            url: toAbsoluteUrl(showPath(show.slug)),
          })),
        }
      : null;

  return (
    <main className={styles.page} id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(personJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(itemListJsonLd) }}
        />
      )}
      <Breadcrumb
        items={[
          { label: "עמוד הבית", href: ROUTES.HOME },
          { label: "שחקנים", href: ROUTES.ACTORS },
          { label: actor.name },
        ]}
      />
      <header className={styles.header}>
        <div className={styles.actorHero}>
          <div className={styles.actorImageWrapper}>
            <Image
              src={actor.image}
              alt={actor.name}
              fill
              sizes="(max-width: 640px) 160px, 200px"
              className={styles.actorImage}
              priority
            />
          </div>
          <div className={styles.actorInfo}>
            <h1 className={styles.title}>{actor.name}</h1>
            <div className={styles.statsRow}>
              <span>{stats.showCount} הצגות</span>
            </div>
          </div>
        </div>
      </header>

      {shows.length > 0 ? (
        <>
          <h2 className={styles.sectionTitle}>כל ההצגות</h2>
          <div className={styles.grid}>
            {shows.map((show, i) => (
              <ShowCard key={show.id} show={show} priority={i < 4} />
            ))}
          </div>
        </>
      ) : (
        <p className={styles.empty}>אין כרגע הצגות רשומות לשחקן/ית זה/ו.</p>
      )}

      <div className={styles.linksRow}>
        <Link href={ROUTES.ACTORS} className={styles.backLink}>
          כל השחקנים
        </Link>
        <Link href={ROUTES.SHOWS} className={styles.backLink}>
          כל ההצגות
        </Link>
      </div>
    </main>
  );
}
