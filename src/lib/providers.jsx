// app/providers.tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
    >
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </NextThemesProvider>
  );
}
