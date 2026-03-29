"use client";

interface ScrollToReviewsLinkProps {
  reviewCount: number;
  className?: string;
}

export default function ScrollToReviewsLink({
  reviewCount,
  className,
}: ScrollToReviewsLinkProps) {
  const handleClick = () => {
    const target = document.getElementById("reviews");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <button type="button" className={className} onClick={handleClick}>
      {reviewCount} ביקורות
    </button>
  );
}
