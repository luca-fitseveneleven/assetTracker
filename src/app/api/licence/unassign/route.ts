import prisma from "../../../../lib/prisma";
import { requirePermission, requireNotDemoMode } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

// DELETE /api/licence/unassign
// Body: { licenceId }
export async function DELETE(req) {
  try {
    const demoBlock = requireNotDemoMode();
    if (demoBlock) return demoBlock;
    await requirePermission("license:assign");
    const { licenceId } = await req.json();
    if (!licenceId) {
      return new Response(JSON.stringify({ error: "licenceId is required" }), {
        status: 400,
      });
    }
    const updated = await prisma.licence.update({
      where: { licenceid: licenceId },
      data: { licenceduserid: null, change_date: new Date() },
    });
    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (e) {
    logger.error("DELETE /api/licence/unassign error", { error: e });
    if (e instanceof Error && e.message === "Unauthorized") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
    if (e instanceof Error && e.message.startsWith("Forbidden")) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 403,
      });
    }
    return new Response(
      JSON.stringify({ error: "Failed to unassign licence" }),
      { status: 500 },
    );
  }
}
