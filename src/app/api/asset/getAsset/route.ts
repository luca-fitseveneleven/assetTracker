import prisma from "../../../../lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";

// GET /api/asset/getAsset?id=<assetid>
export async function GET(req) {
  try {
    await requireApiAuth();
    const id = req.nextUrl.searchParams.get("id");
    if (id) {
      const asset = await prisma.asset.findUnique({ where: { assetid: id } });
      if (!asset) {
        return new Response(
          JSON.stringify({ error: `Asset with id ${id} not found` }),
          { status: 404 }
        );
      }
      return new Response(JSON.stringify(asset), { status: 200 });
    }

    const assets = await prisma.asset.findMany({});
    return new Response(JSON.stringify(assets), { status: 200 });
  } catch (error) {
    console.error("Error fetching asset(s):", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    return new Response(JSON.stringify({ error: "Error fetching asset(s)" }), {
      status: 500,
    });
  }
}
