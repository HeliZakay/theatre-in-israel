"use client";

import { DirectionProvider } from "@radix-ui/react-direction";

interface RadixDirectionProviderProps {
  children: React.ReactNode;
  dir?: "rtl" | "ltr";
}

export default function RadixDirectionProvider({
  children,
  dir = "rtl",
}: RadixDirectionProviderProps) {
  return <DirectionProvider dir={dir}>{children}</DirectionProvider>;
}
