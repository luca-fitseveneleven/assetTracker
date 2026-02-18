import prisma from "../../../../lib/prisma";
import { requireApiAdmin } from "@/lib/api-auth";

export async function DELETE(req) {
  try {
    await requireApiAdmin();
    const { assetId } = await req.json();

    if (!assetId) {
      return new Response(JSON.stringify({ error: "Asset ID is required" }), {
        status: 400,
      });
    }

    // Remove dependent relations first to satisfy FK constraints
    await prisma.$transaction([
      prisma.userAssets.deleteMany({ where: { assetid: assetId } }),
      prisma.asset.delete({ where: { assetid: assetId } }),
    ]);

    return new Response(
      JSON.stringify({ message: "Asset deleted successfully" }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error deleting asset:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return new Response(JSON.stringify({ error: error.message }), { status: 403 });
    }
    return new Response(JSON.stringify({ error: "Error deleting asset" }), {
      status: 500,
    });
  }
}
