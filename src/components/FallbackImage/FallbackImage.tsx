"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

interface FallbackImageProps extends ImageProps {
  fallbackSrc?: string;
}

export default function FallbackImage({
  src,
  alt,
  fallbackSrc = "/show-img-default.png",
  onError,
  ...props
}: FallbackImageProps) {
  const sourceKey =
    typeof src === "string"
      ? src
      : "default" in src
        ? src.default.src
        : src.src;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const isFailed = failedSrc === sourceKey;

  return (
    <Image
      {...props}
      alt={alt}
      src={isFailed ? fallbackSrc : src}
      onError={(event) => {
        if (!isFailed) {
          setFailedSrc(sourceKey);
        }
        onError?.(event);
      }}
    />
  );
}
