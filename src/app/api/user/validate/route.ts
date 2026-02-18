import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";

// GET /api/user/validate?username=...&email=...&excludeId=...
export async function GET(req) {
  try {
    await requireApiAuth();
    const url = req.nextUrl;
    const username = url.searchParams.get("username");
    const email = url.searchParams.get("email");
    const excludeId = url.searchParams.get("excludeId");
    const result: Record<string, { exists: boolean }> = {};

    if (username) {
      const byUsername = await prisma.user.findUnique({ where: { username } });
      result.username = {
        exists: Boolean(byUsername && (!excludeId || byUsername.userid !== excludeId)),
      };
    }
    if (email) {
      const byEmail = await prisma.user.findUnique({ where: { email } });
      result.email = {
        exists: Boolean(byEmail && (!excludeId || byEmail.userid !== excludeId)),
      };
    }

    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    console.error("GET /api/user/validate error:", e);
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Validation error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
