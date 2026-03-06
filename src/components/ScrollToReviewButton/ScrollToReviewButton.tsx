"use client";

interface ScrollToReviewButtonProps {
  className?: string;
  reviewCount: number;
  avgRating: number | null;
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
}: ScrollToReviewButtonProps) {
  const handleClick = () => {
    const target = document.getElementById("write-review");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <button type="button" className={className} onClick={handleClick}>
      {getButtonLabel(reviewCount)}
    </button>
  );
}
