import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";
import {
  getOrganizationContext,
  scopeToOrganization,
} from "@/lib/organization-context";
import { detectDuplicates } from "@/lib/duplicate-detection";
import { cached } from "@/lib/cache";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiAuth();
    const orgCtx = await getOrganizationContext();
    const orgId = orgCtx?.organization?.id;

    const cacheKey = `duplicate_detection:${orgId ?? "global"}`;

    const result = await cached(
      cacheKey,
      async () => {
        const assets = await prisma.asset.findMany({
          where: scopeToOrganization({}, orgId),
          select: {
            assetid: true,
            assetname: true,
            assettag: true,
            serialnumber: true,
            modelid: true,
            locationid: true,
            assetcategorytypeid: true,
          },
        });

        const duplicateAssets = assets.map((a) => ({
          assetId: a.assetid,
          assetName: a.assetname,
          assetTag: a.assettag,
          serialNumber: a.serialnumber,
          modelId: a.modelid,
          locationId: a.locationid,
          categoryId: a.assetcategorytypeid,
        }));

        const groups = detectDuplicates(duplicateAssets);

        // Sort by confidence: high first, then medium, then low
        const confidenceOrder = { high: 0, medium: 1, low: 2 };
        groups.sort(
          (a, b) =>
            confidenceOrder[a.confidence] - confidenceOrder[b.confidence],
        );

        return {
          totalGroups: groups.length,
          groups: groups.slice(0, 20),
        };
      },
      5 * 60 * 1000, // 5-minute TTL (expensive computation)
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error("GET /api/dashboard/duplicates error", { error });
    return NextResponse.json(
      { error: "Failed to detect duplicates" },
      { status: 500 },
    );
  }
}
