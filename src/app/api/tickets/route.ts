import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";

// GET /api/tickets
// Returns tickets based on user role:
// - Admins: all tickets
// - Regular users: only their own tickets
export async function GET(req: Request) {
  try {
    const user = await requireApiAuth();
    
    // Admins see all tickets, users see only their own
    const tickets = await prisma.ticket.findMany({
      where: user.isAdmin ? {} : { createdBy: user.id },
      include: {
        creator: {
          select: {
            userid: true,
            username: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        assignee: {
          select: {
            userid: true,
            username: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                userid: true,
                username: true,
                firstname: true,
                lastname: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(tickets, { status: 200 });
  } catch (error) {
    console.error("GET /api/tickets error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

// POST /api/tickets
// Create a new ticket (any authenticated user can create)
export async function POST(req: Request) {
  try {
    const user = await requireApiAuth();
    const body = await req.json();

    const { title, description, priority } = body || {};

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description: description || null,
        priority: priority || "medium",
        createdBy: user.id!,
        status: "new",
      },
      include: {
        creator: {
          select: {
            userid: true,
            username: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("POST /api/tickets error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
