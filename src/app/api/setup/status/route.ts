import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * GET /api/setup/status
 *
 * Returns whether the application needs initial setup (i.e. no users exist yet).
 * This is used on the login page to redirect first-time deployers to the setup wizard.
 */
export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({ needsSetup: userCount === 0 });
  } catch (error) {
    logger.error("GET /api/setup/status error", { error });
    return NextResponse.json({ needsSetup: false }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
