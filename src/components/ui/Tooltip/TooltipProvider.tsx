"use client";

import { Provider } from "@radix-ui/react-tooltip";

interface TooltipProviderProps {
  children: React.ReactNode;
}

export default function TooltipProvider({ children }: TooltipProviderProps) {
  return (
    <Provider delayDuration={400} skipDelayDuration={300}>
      {children}
    </Provider>
  );
}
