import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  requireApiAuth,
  requireApiAdmin,
  requireNotDemoMode,
} from "@/lib/api-auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// GET /api/requests — list item requests
export async function GET(req: NextRequest) {
  try {
    const user = await requireApiAuth();
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const mine = searchParams.get("mine");
    const limit = searchParams.get("limit");

    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }

    // Non-admins only see their own requests
    if (!user.isAdmin || mine === "true") {
      where.userId = user.id;
    }

    const requests = await prisma.itemRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit ? parseInt(limit) : 50,
      include: {
        user: {
          select: {
            userid: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        approver: {
          select: { userid: true, firstname: true, lastname: true },
        },
      },
    });

    // Resolve entity names
    const enriched = await Promise.all(
      requests.map(async (r) => {
        let entityName = "";
        try {
          switch (r.entityType) {
            case "asset": {
              const a = await prisma.asset.findUnique({
                where: { assetid: r.entityId },
                select: { assetname: true, assettag: true },
              });
              entityName = a
                ? `${a.assetname} (${a.assettag})`
                : "Unknown asset";
              break;
            }
            case "accessory": {
              const a = await prisma.accessories.findUnique({
                where: { accessorieid: r.entityId },
                select: { accessoriename: true },
              });
              entityName = a?.accessoriename || "Unknown accessory";
              break;
            }
            case "consumable": {
              const c = await prisma.consumable.findUnique({
                where: { consumableid: r.entityId },
                select: { consumablename: true },
              });
              entityName = c?.consumablename || "Unknown consumable";
              break;
            }
            case "licence": {
              const l = await prisma.licence.findUnique({
                where: { licenceid: r.entityId },
                select: { licencekey: true },
              });
              entityName = l?.licencekey || "Unknown licence";
              break;
            }
          }
        } catch {
          entityName = "Unknown";
        }
        return { ...r, entityName };
      }),
    );

    return NextResponse.json(enriched);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error("GET /api/requests error", { error });
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 },
    );
  }
}

// POST /api/requests — create a new request
export async function POST(req: NextRequest) {
  try {
    const demoBlock = requireNotDemoMode();
    if (demoBlock) return demoBlock;
    const user = await requireApiAuth();

    const body = await req.json();
    const { entityType, entityId, startDate, endDate, notes, quantity } = body;
    const initialStatus =
      body.status === "return_pending" ? "return_pending" : "pending";

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType and entityId required" },
        { status: 400 },
      );
    }

    const validTypes = ["asset", "accessory", "consumable", "licence"];
    if (!validTypes.includes(entityType)) {
      return NextResponse.json(
        { error: "Invalid entity type" },
        { status: 400 },
      );
    }

    // Prevent duplicate active requests for the same item
    const existingRequest = await prisma.itemRequest.findFirst({
      where: {
        entityType,
        entityId,
        userId: user.id,
        status: { in: ["pending", "approved", "return_pending"] },
      },
    });
    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have an active request for this item" },
        { status: 409 },
      );
    }

    const request = await prisma.itemRequest.create({
      data: {
        entityType,
        entityId,
        userId: user.id,
        status: initialStatus,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        notes: notes || null,
        quantity: quantity || 1,
        updatedAt: new Date(),
      },
    });

    // Notify all admins (in-app via notification_queue)
    try {
      const admins = await prisma.user.findMany({
        where: { isadmin: true, isActive: true },
        select: { userid: true, email: true },
      });
      const entityName = await getEntityName(entityType, entityId);
      for (const admin of admins) {
        await prisma.notification_queue.create({
          data: {
            userId: admin.userid,
            type: "request",
            recipient: admin.email || "",
            subject: `New ${entityType} request`,
            body: `${user.name || user.email || "A user"} requested ${entityName}`,
            status: "pending",
          },
        });
      }
    } catch {
      // notification failures shouldn't block the request
    }

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error("POST /api/requests error", { error });
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 },
    );
  }
}

// PUT /api/requests — approve/reject/cancel
export async function PUT(req: NextRequest) {
  try {
    const demoBlock = requireNotDemoMode();
    if (demoBlock) return demoBlock;
    const user = await requireApiAuth();

    const { id, status, notes } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status required" },
        { status: 400 },
      );
    }

    const existing = await prisma.itemRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Only admins can approve/reject/confirm returns
    if (
      (status === "approved" ||
        status === "rejected" ||
        status === "returned") &&
      !user.isAdmin
    ) {
      return NextResponse.json(
        { error: "Only admins can approve, reject, or confirm returns" },
        { status: 403 },
      );
    }

    // Only requester can cancel (or admin)
    if (
      status === "cancelled" &&
      existing.userId !== user.id &&
      !user.isAdmin
    ) {
      return NextResponse.json(
        { error: "You can only cancel your own requests" },
        { status: 403 },
      );
    }

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (notes !== undefined) updateData.notes = notes;

    if (status === "approved" || status === "rejected") {
      updateData.approvedBy = user.id;
      updateData.approvedAt = new Date();
    }

    if (status === "returned") {
      updateData.returnedAt = new Date();
    }

    const updated = await prisma.itemRequest.update({
      where: { id },
      data: updateData,
    });

    // On return, unassign the item
    if (status === "returned") {
      try {
        await unassignItem(
          existing.entityType,
          existing.entityId,
          existing.userId,
        );
      } catch (err) {
        logger.error("Unassign failed after return", {
          error: err,
          requestId: id,
        });
      }
    }

    // On approval, auto-assign the item
    if (status === "approved") {
      try {
        await autoAssignItem(
          existing.entityType,
          existing.entityId,
          existing.userId,
          existing.quantity,
        );
      } catch (err) {
        logger.error("Auto-assign failed after approval", {
          error: err,
          requestId: id,
        });
      }
    }

    // Notify the requester
    try {
      const requester = await prisma.user.findUnique({
        where: { userid: existing.userId },
        select: { userid: true, email: true },
      });
      if (requester) {
        const entityName = await getEntityName(
          existing.entityType,
          existing.entityId,
        );
        await prisma.notification_queue.create({
          data: {
            userId: requester.userid,
            type: "request_decision",
            recipient: requester.email || "",
            subject: `Request ${status}`,
            body: `Your request for ${entityName} has been ${status}`,
            status: "pending",
          },
        });
      }
    } catch {
      // notification failures shouldn't block
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error("PUT /api/requests error", { error });
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 },
    );
  }
}

async function getEntityName(
  entityType: string,
  entityId: string,
): Promise<string> {
  try {
    switch (entityType) {
      case "asset": {
        const a = await prisma.asset.findUnique({
          where: { assetid: entityId },
          select: { assetname: true },
        });
        return a?.assetname || "Unknown";
      }
      case "accessory": {
        const a = await prisma.accessories.findUnique({
          where: { accessorieid: entityId },
          select: { accessoriename: true },
        });
        return a?.accessoriename || "Unknown";
      }
      case "consumable": {
        const c = await prisma.consumable.findUnique({
          where: { consumableid: entityId },
          select: { consumablename: true },
        });
        return c?.consumablename || "Unknown";
      }
      case "licence": {
        const l = await prisma.licence.findUnique({
          where: { licenceid: entityId },
          select: { licencekey: true },
        });
        return l?.licencekey || "Unknown";
      }
    }
  } catch {}
  return "Unknown";
}

async function autoAssignItem(
  entityType: string,
  entityId: string,
  userId: string,
  quantity: number,
) {
  switch (entityType) {
    case "asset": {
      const existing = await prisma.userAssets.findFirst({
        where: { assetid: entityId },
      });
      if (!existing) {
        await prisma.userAssets.create({
          data: {
            assetid: entityId,
            userid: userId,
            creation_date: new Date(),
          },
        });
        const active = await prisma.statusType.findFirst({
          where: { statustypename: { equals: "Active", mode: "insensitive" } },
        });
        if (active) {
          await prisma.asset.update({
            where: { assetid: entityId },
            data: {
              statustypeid: active.statustypeid,
              change_date: new Date(),
            },
          });
        }
      }
      break;
    }
    case "accessory": {
      await prisma.userAccessoires.create({
        data: {
          accessorieid: entityId,
          userid: userId,
          creation_date: new Date(),
        },
      });
      break;
    }
    case "consumable": {
      await prisma.consumable.update({
        where: { consumableid: entityId },
        data: { quantity: { decrement: quantity } },
      });
      await prisma.consumable_checkouts.create({
        data: { consumableId: entityId, userId, quantity },
      });
      break;
    }
    case "licence": {
      await prisma.licence.update({
        where: { licenceid: entityId },
        data: { licenceduserid: userId },
      });
      break;
    }
  }
}

async function unassignItem(
  entityType: string,
  entityId: string,
  userId: string,
) {
  switch (entityType) {
    case "asset": {
      await prisma.userAssets.deleteMany({
        where: { assetid: entityId, userid: userId },
      });
      const available = await prisma.statusType.findFirst({
        where: {
          statustypename: { equals: "Available", mode: "insensitive" },
        },
      });
      if (available) {
        await prisma.asset.update({
          where: { assetid: entityId },
          data: {
            statustypeid: available.statustypeid,
            change_date: new Date(),
          },
        });
      }
      break;
    }
    case "accessory": {
      await prisma.userAccessoires.deleteMany({
        where: { accessorieid: entityId, userid: userId },
      });
      break;
    }
    case "consumable": {
      // Consumables are consumed, no return
      break;
    }
    case "licence": {
      await prisma.licence.update({
        where: { licenceid: entityId },
        data: { licenceduserid: null },
      });
      break;
    }
  }
}
