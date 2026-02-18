import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";

// GET /api/userAccessoires?userId=...
export async function GET(req) {
  try {
    const authUser = await requireApiAuth();
    const userId = req.nextUrl.searchParams.get("userId");
    const resolvedUserId = authUser.isAdmin ? userId : authUser.id;
    const where = resolvedUserId ? { userid: resolvedUserId } : {};
    const rows = await prisma.userAccessoires.findMany({ where });
    return NextResponse.json(rows, { status: 200 });
  } catch (e) {
    console.error("GET /api/userAccessoires error:", e);
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch userAccessoires" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
