import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function reservationStatusVariant(status: string) {
  switch (status) {
    case "approved":
      return "success" as const;
    case "pending":
      return "warning" as const;
    case "rejected":
    case "cancelled":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function ticketStatusVariant(status: string) {
  switch (status) {
    case "new":
      return "info" as const;
    case "open":
    case "in_progress":
      return "warning" as const;
    case "resolved":
    case "closed":
      return "success" as const;
    default:
      return "secondary" as const;
  }
}

function ticketPriorityVariant(priority: string) {
  switch (priority) {
    case "critical":
    case "high":
      return "destructive" as const;
    case "medium":
      return "warning" as const;
    case "low":
      return "secondary" as const;
    default:
      return "secondary" as const;
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function UserDashboard({
  userId,
}: {
  userId: string | undefined;
}) {
  if (!userId) {
    return (
      <main>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          My Dashboard
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Unable to load your dashboard. Please sign in.
        </p>
      </main>
    );
  }

  const [userAssets, reservations, tickets] = await Promise.all([
    prisma.userAssets.findMany({
      where: { userid: userId },
      include: {
        asset: {
          include: {
            statusType: true,
          },
        },
      },
    }),
    prisma.assetReservation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        asset: {
          select: { assetname: true, assettag: true },
        },
      },
    }),
    prisma.tickets.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        My Dashboard
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Your assets, requests, and tickets at a glance
      </p>

      {/* Section 1: My Assets */}
      <section className="mt-6 sm:mt-8 md:mt-10">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">My Assets</h2>
        {userAssets.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No assets assigned to you
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {userAssets.map((ua) => (
              <Link
                key={ua.userassetsid}
                href={`/assets/${ua.assetid}`}
                className="block transition-opacity hover:opacity-80"
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {ua.asset.assetname}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      {ua.asset.assettag}
                    </p>
                    {ua.asset.statusType && (
                      <Badge variant="secondary" className="mt-2">
                        {ua.asset.statusType.statustypename}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Section 2: My Requests */}
      <section className="mt-6 sm:mt-8 md:mt-10">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          My Requests
        </h2>
        {reservations.length === 0 ? (
          <p className="text-muted-foreground text-sm">No pending requests</p>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <ul className="divide-y">
                {reservations.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {r.asset.assetname}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {r.asset.assettag}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={reservationStatusVariant(r.status)}>
                        {r.status}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {formatDate(r.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Section 3: My Tickets */}
      <section className="mt-6 sm:mt-8 md:mt-10">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          My Tickets
        </h2>
        {tickets.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tickets</p>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <ul className="divide-y">
                {tickets.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={ticketStatusVariant(t.status)}>
                        {t.status}
                      </Badge>
                      <Badge variant={ticketPriorityVariant(t.priority)}>
                        {t.priority}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {formatDate(t.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
