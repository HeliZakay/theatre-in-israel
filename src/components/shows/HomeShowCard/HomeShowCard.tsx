import Link from "next/link";
import Card from "@/components/ui/Card/Card";
import FallbackImage from "@/components/ui/FallbackImage/FallbackImage";
import Tag from "@/components/ui/Tag/Tag";
import WatchlistToggle from "@/components/shows/WatchlistToggle/WatchlistToggle";
import NewBadge from "@/components/shows/NewBadge/NewBadge";
import { showPath } from "@/constants/routes";
import { getShowImagePath } from "@/utils/getShowImagePath";
import styles from "./HomeShowCard.module.css";

export interface HomeShowCardData {
  id: number;
  slug: string;
  title: string;
  theatre: string;
  genre: string[];
  avgRating: number | null;
  reviewCount: number;
  isNew?: boolean;
}

interface HomeShowCardProps {
  show: HomeShowCardData;
  sectionGenres?: string[];
  imageSizes?: string;
}

export default function HomeShowCard({
  show,
  sectionGenres,
  imageSizes = "(max-width: 640px) 80vw, (max-width: 1024px) 33vw, 20vw",
}: HomeShowCardProps) {
  const slug = show.slug ?? String(show.id);
  const genres = show.genre ?? [];
  const orderedGenres = sectionGenres
    ? [
        ...genres.filter((g) => sectionGenres.includes(g)),
        ...genres.filter((g) => !sectionGenres.includes(g)),
      ]
    : genres;

  return (
    <div className={styles.cardWrapper}>
      <Link className={styles.cardLink} href={showPath(slug)}>
        <Card as="article" className={styles.card}>
          <div className={styles.thumb}>
            {show.isNew && <NewBadge />}
            <FallbackImage
              src={getShowImagePath(show.title)}
              alt={show.title}
              fill
              sizes={imageSizes}
              className={styles.thumbImage}
            />
          </div>
          <div className={styles.body}>
            <h3 className={styles.cardTitle}>{show.title}</h3>
            <p className={styles.meta}>{show.theatre}</p>
            <div className={styles.genreRow}>
              {orderedGenres.slice(0, 3).map((item) => (
                <Tag key={item}>{item}</Tag>
              ))}
            </div>
            <div className={styles.bottomRow}>
              <div className={styles.rating}>
                {show.avgRating !== null ? (
                  <>
                    {show.avgRating.toFixed(1)}
                    <span className={styles.star}>★</span>
                    {show.reviewCount > 0 && (
                      <span className={styles.reviewCount}>
                        {show.reviewCount} ביקורות
                      </span>
                    )}
                  </>
                ) : (
                  <span className={styles.noRating}>טרם דורג</span>
                )}
              </div>
              <WatchlistToggle
                showId={show.id}
                showSlug={slug}
                variant="inline"
              />
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}
