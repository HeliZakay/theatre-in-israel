"use client";

import Link from "next/link";

interface ScrollToReviewButtonProps {
  className?: string;
  reviewCount: number;
  avgRating: number | null;
  href?: string;
}

function getButtonLabel(reviewCount: number): string {
  if (reviewCount === 0) return "היו הראשונים לדרג! ⭐";
  if (reviewCount <= 5) return `הצטרפו ל-${reviewCount} ביקורות`;
  return "כתב.י ביקורת";
}

export default function ScrollToReviewButton({
  className,
  reviewCount,
  avgRating,
  href,
}: ScrollToReviewButtonProps) {
  const label = getButtonLabel(reviewCount);

  if (href) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  const handleClick = () => {
    const target = document.getElementById("write-review");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <button type="button" className={className} onClick={handleClick}>
      {label}
    </button>
  );
}
