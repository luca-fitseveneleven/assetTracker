"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeSwitcher from "./ThemeSwitcher.jsx";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationIcon } from "../ui/Icons.jsx";
import { cn } from "@/lib/utils";

function Navigation({ userName }) {
  const route = usePathname();
  const [activeMenu, setActiveMenu] = useState("");

  useEffect(() => {
    const routeSegment = route.split("/")[1];
    setActiveMenu(routeSegment);
  }, [route]);

  const isActive = (path) => {
    return activeMenu === path;
  };

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="flex items-center gap-6 flex-1">
          <Link href="/" className="hidden sm:block font-bold text-lg">
            Asset Tracker
          </Link>
          
          <div className="hidden sm:flex gap-6">
            <Link
              href="/user"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("user") ? "text-primary" : "text-muted-foreground"
              )}
            >
              Users
            </Link>
            <Link
              href="/assets"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("assets") ? "text-primary" : "text-muted-foreground"
              )}
            >
              Assets
            </Link>
            <Link
              href="/accessories"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("accessories") ? "text-primary" : "text-muted-foreground"
              )}
            >
              Accessories
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  Item Menu
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[220px]">
                <DropdownMenuItem asChild>
                  <Link href="/locations">Locations</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/manufacturers">Manufacturer</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/suppliers">Supplier</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/licences">Licences</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/consumables">Consumable</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <NotificationIcon size={24} />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  99+
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="py-3">
                <div className="flex flex-row items-center gap-6 justify-between w-full">
                  <span>An asset got assigned</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem className="text-destructive">
                Delete all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeSwitcher />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="https://images.unsplash.com/broken" alt={userName} />
                  <AvatarFallback>LG</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Signed in as</p>
                  <p className="text-xs leading-none text-muted-foreground">{userName}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/user/123">My Items</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/user/123/settings">My Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/user/123/edit">Edit Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
