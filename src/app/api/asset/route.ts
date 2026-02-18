import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireApiAuth, requireApiAdmin } from "@/lib/api-auth";
import { createAssetSchema } from "@/lib/validation";

const assetSchema = createAssetSchema.extend({
  purchaseprice: z.number().nonnegative().nullable().optional(),
  warrantyMonths: z.number().int().nonnegative().nullable().optional(),
  warrantyExpires: z.string().datetime().nullable().optional(),
});

const updateSchema = assetSchema.partial().strict();

const normalizeDateInput = (value: unknown) => {
  if (value === null || value === undefined) return value;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00:00.000Z`;
  }
  return trimmed;
};

const normalizeNumberInput = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return undefined;
  if (typeof value === "number") return value;
  const num = Number(value);
  return Number.isNaN(num) ? value : num;
};

// GET /api/asset
// Optional query: ?id=<assetid>
export async function GET(req) {
  try {
    await requireApiAuth();
    const id = req.nextUrl.searchParams.get("id");

    if (id) {
      const asset = await prisma.asset.findUnique({ where: { assetid: id } });
      if (!asset) {
        return NextResponse.json(
          { error: `Asset with id ${id} not found` },
          { status: 404 }
        );
      }
      return NextResponse.json(asset, { status: 200 });
    }

    const assets = await prisma.asset.findMany({});
    return NextResponse.json(assets, { status: 200 });
  } catch (error) {
    console.error("GET /api/asset error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}

// POST /api/asset
export async function POST(req) {
  try {
    await requireApiAdmin();
    const body = await req.json();

    const normalized = {
      ...body,
      purchaseprice: normalizeNumberInput(body?.purchaseprice),
      purchasedate: normalizeDateInput(body?.purchasedate),
      warrantyMonths: normalizeNumberInput(body?.warrantyMonths),
      warrantyExpires: normalizeDateInput(body?.warrantyExpires),
    };

    const validationResult = assetSchema.strict().safeParse(normalized);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const {
      assetname,
      assettag,
      serialnumber,
      modelid,
      specs,
      notes,
      purchaseprice,
      purchasedate,
      mobile,
      requestable,
      assetcategorytypeid,
      statustypeid,
      supplierid,
      locationid,
      manufacturerid,
      warrantyMonths,
      warrantyExpires,
    } = validationResult.data;

    const created = await prisma.asset.create({
      data: {
        assetname,
        assettag,
        serialnumber,
        modelid: modelid ?? null,
        specs: specs ?? null,
        notes: notes ?? null,
        purchaseprice: purchaseprice ?? null,
        purchasedate: purchasedate ? new Date(purchasedate) : null,
        mobile: typeof mobile === "boolean" ? mobile : null,
        requestable: typeof requestable === "boolean" ? requestable : null,
        assetcategorytypeid: assetcategorytypeid ?? null,
        statustypeid: statustypeid ?? null,
        supplierid: supplierid ?? null,
        locationid: locationid ?? null,
        manufacturerid: manufacturerid ?? null,
        warrantyMonths: warrantyMonths ?? null,
        warrantyExpires: warrantyExpires ? new Date(warrantyExpires) : null,
        creation_date: new Date(),
      } as Prisma.assetUncheckedCreateInput,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/asset error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
  }
}

// PUT /api/asset
// Body must include assetid; any provided fields will be updated
export async function PUT(req) {
  try {
    await requireApiAdmin();
    const body = await req.json();
    const { assetid, ...data } = body || {};

    if (!assetid) {
      return NextResponse.json(
        { error: "assetid is required to update an asset" },
        { status: 400 }
      );
    }

    const normalized = {
      ...data,
      purchaseprice: normalizeNumberInput(data?.purchaseprice),
      purchasedate: normalizeDateInput(data?.purchasedate),
      warrantyMonths: normalizeNumberInput(data?.warrantyMonths),
      warrantyExpires: normalizeDateInput(data?.warrantyExpires),
    };

    const validationResult = updateSchema.safeParse(normalized);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const updateData = { ...validationResult.data } as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(updateData, "purchasedate") && updateData.purchasedate) {
      updateData.purchasedate = new Date(updateData.purchasedate as string);
    }
    if (Object.prototype.hasOwnProperty.call(updateData, "warrantyExpires") && updateData.warrantyExpires) {
      updateData.warrantyExpires = new Date(updateData.warrantyExpires as string);
    }

    const updated = await prisma.asset.update({
      where: { assetid },
      data: {
        ...updateData,
        change_date: new Date(),
      },
    });
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("PUT /api/asset error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
