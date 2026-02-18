import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";

// GET /api/userAssets
export async function GET() {
  try {
    const user = await requireApiAuth();
    const where = user.isAdmin ? {} : { userid: user.id };
    const items = await prisma.userAssets.findMany({ where });
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("GET /api/userAssets error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch userAssets" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
