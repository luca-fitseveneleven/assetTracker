"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Box } from "lucide-react";

export default function MarketingFooter() {
  const footerRef = useRef<HTMLElement>(null);
  const [footerHeight, setFooterHeight] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (footerRef.current) {
        setFooterHeight(footerRef.current.offsetHeight);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <>
      {/* Spacer so content doesn't overlap the fixed footer */}
      <div style={{ height: footerHeight }} />

      <footer
        ref={footerRef}
        className="fixed inset-x-0 bottom-0 z-0 border-t border-border/40 bg-muted/30"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5">
                <Box className="h-5 w-5 text-foreground" />
                <span className="text-base font-semibold tracking-tight text-foreground">
                  Asset Tracker
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Modern asset management platform for teams of all sizes.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Product
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/#features"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#how-it-works"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    How it works
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Company
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Get started */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Get Started
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/register"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-border/40 pt-8">
            <p className="text-center text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Asset Tracker. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
