import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";

// GET: List all maintenance schedules, optionally filtered by assetId
export async function GET(req: NextRequest) {
  try {
    await requireApiAuth();

    const assetId = req.nextUrl.searchParams.get("assetId");

    const where: { assetId?: string } = {};
    if (assetId) {
      where.assetId = assetId;
    }

    const schedules = await prisma.maintenance_schedules.findMany({
      where,
      include: {
        asset: {
          select: { assetid: true, assetname: true },
        },
        user: {
          select: { userid: true, firstname: true, lastname: true },
        },
      },
      orderBy: { nextDueDate: "asc" },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching maintenance schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance schedules" },
      { status: 500 }
    );
  }
}

// POST: Create a new maintenance schedule
export async function POST(req: NextRequest) {
  try {
    await requireApiAuth();

    const body = await req.json();

    const { title, assetId, frequency, nextDueDate, description, assignedTo, estimatedCost, isActive } = body;

    // Validate required fields
    if (!title || !assetId || !frequency || !nextDueDate) {
      return NextResponse.json(
        { error: "Missing required fields: title, assetId, frequency, nextDueDate" },
        { status: 400 }
      );
    }

    // Validate frequency value
    const validFrequencies = ["daily", "weekly", "monthly", "quarterly", "annually"];
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: `Invalid frequency. Must be one of: ${validFrequencies.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify asset exists
    const asset = await prisma.asset.findUnique({
      where: { assetid: assetId },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Verify assigned user exists if provided
    if (assignedTo) {
      const user = await prisma.user.findUnique({
        where: { userid: assignedTo },
      });
      if (!user) {
        return NextResponse.json({ error: "Assigned user not found" }, { status: 404 });
      }
    }

    const schedule = await prisma.maintenance_schedules.create({
      data: {
        title,
        assetId,
        frequency,
        nextDueDate: new Date(nextDueDate),
        description: description || null,
        assignedTo: assignedTo || null,
        estimatedCost: estimatedCost != null ? estimatedCost : null,
        isActive: isActive != null ? isActive : true,
        updatedAt: new Date(),
      },
      include: {
        asset: {
          select: { assetid: true, assetname: true },
        },
        user: {
          select: { userid: true, firstname: true, lastname: true },
        },
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating maintenance schedule:", error);
    return NextResponse.json(
      { error: "Failed to create maintenance schedule" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
