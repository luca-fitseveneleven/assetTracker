import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    await requireApiAuth();

    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get("assetId");

    if (!assetId) {
      return NextResponse.json(
        { error: "assetId is required" },
        { status: 400 }
      );
    }

    const attachments = await prisma.asset_attachments.findMany({
      where: { assetId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            userid: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch attachments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const assetId = formData.get("assetId") as string | null;
    const isPrimaryRaw = formData.get("isPrimary");
    const isPrimary = isPrimaryRaw === "true";

    if (!file) {
      return NextResponse.json(
        { error: "file is required" },
        { status: 400 }
      );
    }

    if (!assetId) {
      return NextResponse.json(
        { error: "assetId is required" },
        { status: 400 }
      );
    }

    const originalName = file.name;
    const uniqueFilename = `${crypto.randomUUID()}_${originalName}`;

    const uploadDir = join(process.cwd(), "public/uploads/attachments");
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(join(uploadDir, uniqueFilename), buffer);

    const attachment = await prisma.asset_attachments.create({
      data: {
        assetId,
        filename: uniqueFilename,
        originalName,
        mimeType: file.type,
        size: file.size,
        path: `/uploads/attachments/${uniqueFilename}`,
        isPrimary,
        uploadedBy: user.id,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to upload attachment" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
