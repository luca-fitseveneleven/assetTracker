"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useSession, type SessionUser } from "@/lib/auth-client";
import {
  navSections,
  primaryNavItems,
  isActivePath,
  filterSectionsForUser,
} from "@/lib/nav-config";

export default function MobileNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;
  const isAdmin = !!user?.isadmin;

  const filteredSections = useMemo(
    () => filterSectionsForUser(navSections, isAdmin),
    [isAdmin],
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden pb-safe"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-1">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-2 py-2 text-[10px] font-medium transition-colors touch-target",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-primary")} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors touch-target"
              aria-label="Open full navigation menu"
            >
              <Menu className="h-5 w-5" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] overflow-y-auto p-0">
            <SheetHeader className="px-4 pt-4 pb-2">
              <SheetTitle>Asset Tracker</SheetTitle>
            </SheetHeader>
            <div className="px-2 py-2">
              {filteredSections.map((section) => (
                <div key={section.title} className="mb-4">
                  <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {section.title}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActivePath(
                        pathname,
                        item.href,
                        item.exact,
                      );
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSheetOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors touch-target",
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground",
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
