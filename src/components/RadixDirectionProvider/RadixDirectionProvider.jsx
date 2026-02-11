"use client";

import { DirectionProvider } from "@radix-ui/react-direction";

export default function RadixDirectionProvider({ children, dir = "rtl" }) {
  return <DirectionProvider dir={dir}>{children}</DirectionProvider>;
}
