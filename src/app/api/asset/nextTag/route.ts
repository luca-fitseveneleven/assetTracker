import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";
import {
  getOrganizationContext,
  scopeToOrganization,
} from "@/lib/organization-context";
import { logger } from "@/lib/logger";

// GET /api/asset/nextTag
export async function GET() {
  try {
    await requireApiAuth();
    const orgCtx = await getOrganizationContext();
    const orgId = orgCtx?.organization?.id;

    // Find all assets with tags matching the ASSET-XXXX pattern
    const assets = await prisma.asset.findMany({
      where: scopeToOrganization({ assettag: { startsWith: "ASSET-" } }, orgId),
      select: { assettag: true },
    });

    let nextNumber = 1;

    if (assets.length > 0) {
      const numbers = assets
        .map((a) => {
          const match = a.assettag.match(/^ASSET-(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => n > 0);

      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
      }
    }

    const tag = `ASSET-${String(nextNumber).padStart(4, "0")}`;

    return NextResponse.json({ tag }, { status: 200 });
  } catch (e) {
    logger.error("GET /api/asset/nextTag error", { error: e });
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to generate next tag" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
