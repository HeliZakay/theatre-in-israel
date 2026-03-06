"use client";

interface ScrollToReviewButtonProps {
  className?: string;
}

export default function ScrollToReviewButton({
  className,
}: ScrollToReviewButtonProps) {
  const handleClick = () => {
    const target = document.getElementById("write-review");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <button type="button" className={className} onClick={handleClick}>
      כתב.י ביקורת
    </button>
  );
}
