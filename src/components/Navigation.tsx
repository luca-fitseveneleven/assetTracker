"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession, type SessionUser } from "@/lib/auth-client";
import ThemeSwitcher from "./ThemeSwitcher";
import { SignOutButton } from "./SignOutButton";
import GlobalSearch from "./GlobalSearch";
import { Search, X, Loader2, Bell, Check } from "lucide-react";
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
import { NotificationIcon } from "../ui/Icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
}

function Navigation() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return;

    setNotificationsLoading(true);
    try {
      const response = await fetch("/api/notifications?limit=10");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setNotificationsLoading(false);
    }
  }, [session?.user?.id]);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sent" }),
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, status: "sent" } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Delete single notification
  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        const notification = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (notification?.status === "pending") {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        toast.success("Notification deleted");
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    setDeletingAll(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
      });
      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
        toast.success("All notifications deleted");
      }
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
      toast.error("Failed to delete notifications");
    } finally {
      setDeletingAll(false);
    }
  };

  // Fetch notifications on mount and poll every 30s for new ones
  useEffect(() => {
    fetchNotifications();

    const POLL_INTERVAL = 30_000;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (!intervalId) {
        intervalId = setInterval(fetchNotifications, POLL_INTERVAL);
      }
    };
    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Pause polling when the tab is hidden to save requests
    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchNotifications();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchNotifications]);

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Get user initials for avatar
  const getInitials = () => {
    if (user?.firstname && user?.lastname) {
      return `${user.firstname[0]}${user.lastname[0]}`.toUpperCase();
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const userName = user?.name || user?.username || "User";

  return (
    <nav className="border-border/60 bg-background/95 border-b backdrop-blur-sm">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="flex flex-1 items-center gap-4">
          <Link href="/dashboard" className="text-lg font-bold">
            Asset Tracker
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Global Search Button */}
          <Button
            variant="outline"
            className="text-muted-foreground hidden w-64 items-center gap-2 md:flex"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="bg-muted pointer-events-none hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-xs font-medium opacity-100 select-none sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

          <DropdownMenu
            onOpenChange={(open) => {
              if (open) fetchNotifications();
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <NotificationIcon size={24} />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center p-0 text-xs"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {notificationsLoading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {notifications.length === 0 ? (
                <div className="text-muted-foreground py-6 text-center text-sm">
                  {notificationsLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading notifications...
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Bell className="text-muted-foreground/50 h-8 w-8" />
                      <span>No notifications</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={cn(
                        "flex cursor-pointer flex-col items-start gap-1 py-3",
                        notification.status === "pending" && "bg-muted/50",
                      )}
                      onClick={() => {
                        if (notification.status === "pending") {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <span className="line-clamp-1 text-sm font-medium">
                          {notification.subject}
                        </span>
                        <div className="flex shrink-0 items-center gap-1">
                          {notification.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <span className="text-muted-foreground line-clamp-2 text-xs">
                        {notification.body
                          .replace(/<[^>]*>/g, "")
                          .slice(0, 100)}
                        {notification.body.length > 100 && "..."}
                      </span>
                      <span className="text-muted-foreground/70 text-xs">
                        {new Date(notification.createdAt).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}

              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    className="text-destructive cursor-pointer"
                    onClick={deleteAllNotifications}
                    disabled={deletingAll}
                  >
                    {deletingAll ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Delete all notifications
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeSwitcher />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src="https://images.unsplash.com/broken"
                    alt={userName}
                  />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm leading-none font-medium">
                    Signed in as
                  </p>
                  <p className="text-muted-foreground text-xs leading-none">
                    {userName}
                  </p>
                  {session?.user?.email && (
                    <p className="text-muted-foreground text-xs leading-none">
                      {session.user.email}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/user/${user?.id || "123"}`}>My Items</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={user?.isadmin ? "/admin/tickets" : "/user/tickets"}>
                  {user?.isadmin ? "Tickets" : "My Tickets"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/user/${user?.id || "123"}/settings`}>
                  My Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/user/${user?.id || "123"}/edit`}>
                  Edit Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <SignOutButton />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
