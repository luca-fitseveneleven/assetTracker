"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface PhantomLoaderProps {
  loading: boolean;
  children: ReactNode;
  animation?: "shimmer" | "pulse" | "breathe";
}

export default function PhantomLoader({
  loading,
  children,
  animation = "shimmer",
}: PhantomLoaderProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@aejkatappaja/phantom-ui");
    }
  }, []);

  return (
    // @ts-expect-error -- phantom-ui is a Web Component, not in JSX types
    <phantom-ui loading={loading} animation={animation} ref={ref}>
      {children}
      {/* @ts-expect-error */}
    </phantom-ui>
  );
}
