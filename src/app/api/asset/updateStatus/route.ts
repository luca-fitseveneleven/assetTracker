import prisma from "../../../../lib/prisma";

// PUT /api/asset/updateStatus
// Body: { assetId: string, statusTypeId?: string, statusName?: string }
export async function PUT(req) {
  try {
    const { assetId, statusTypeId, statusName } = await req.json();

    if (!assetId || (!statusTypeId && !statusName)) {
      return new Response(
        JSON.stringify({ error: "assetId and statusTypeId or statusName are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let statusId = statusTypeId;
    if (!statusId && statusName) {
      const found = await prisma.statusType.findFirst({
        where: { statustypename: { equals: statusName, mode: "insensitive" } },
      });
      if (!found) {
        return new Response(
          JSON.stringify({ error: `Status '${statusName}' not found` }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      statusId = found.statustypeid;
    }

    const updated = await prisma.asset.update({
      where: { assetid: assetId },
      data: { statustypeid: statusId, change_date: new Date() },
    });

    return new Response(JSON.stringify(updated), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("PUT /api/asset/updateStatus error:", error);
    
    // Handle Prisma-specific errors
    let errorMessage = "Failed to update status";
    let statusCode = 500;
    
    if (error.code === "P2025") {
      errorMessage = "Asset not found";
      statusCode = 404;
    } else if (error.code === "P2003") {
      errorMessage = "Invalid status ID - status does not exist";
      statusCode = 400;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        code: error.code || "UNKNOWN"
      }), 
      { 
        status: statusCode,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

export const dynamic = "force-dynamic";

