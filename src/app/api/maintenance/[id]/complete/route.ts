import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Advance a date based on maintenance frequency.
 * daily -> +1 day, weekly -> +7 days, monthly -> +1 month,
 * quarterly -> +3 months, annually -> +1 year
 */
function advanceDate(date: Date, frequency: string): Date {
  const next = new Date(date);
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      break;
    case "annually":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      // Fallback: advance by 30 days
      next.setDate(next.getDate() + 30);
      break;
  }
  return next;
}

// POST: Complete a maintenance schedule entry
export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireApiAuth();

    const { id } = await params;

    const schedule = await prisma.maintenance_schedules.findUnique({
      where: { id },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Maintenance schedule not found" },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { notes, actualCost } = body;

    const now = new Date();
    const newNextDueDate = advanceDate(schedule.nextDueDate, schedule.frequency);

    // Create maintenance log and update schedule in a transaction
    const [log, updatedSchedule] = await prisma.$transaction([
      prisma.maintenance_logs.create({
        data: {
          scheduleId: id,
          completedBy: user.id || null,
          completedAt: now,
          notes: notes || null,
          actualCost: actualCost != null ? actualCost : null,
        },
        include: {
          user: {
            select: { userid: true, firstname: true, lastname: true },
          },
        },
      }),
      prisma.maintenance_schedules.update({
        where: { id },
        data: {
          lastCompletedAt: now,
          nextDueDate: newNextDueDate,
          updatedAt: now,
        },
        include: {
          asset: {
            select: { assetid: true, assetname: true },
          },
          user: {
            select: { userid: true, firstname: true, lastname: true },
          },
        },
      }),
    ]);

    return NextResponse.json(
      {
        log,
        schedule: updatedSchedule,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error completing maintenance:", error);
    return NextResponse.json(
      { error: "Failed to complete maintenance" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
