import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/settings/sso
 * Get SSO configuration settings
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.system_settings.findMany({
      where: {
        settingKey: {
          startsWith: "sso.",
        },
      },
    });

    const result = settings.map((s) => ({
      id: s.id,
      key: s.settingKey,
      value: s.isEncrypted ? "********" : s.settingValue,
      type: s.settingType,
      description: s.description,
      isEncrypted: s.isEncrypted,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/admin/settings/sso error:", error);
    return NextResponse.json(
      { error: "Failed to get SSO settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/sso
 * Save SSO configuration settings
 */
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { settings } = body;

    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { error: "settings array is required" },
        { status: 400 }
      );
    }

    const encryptedKeys = ["sso.clientSecret"];

    await prisma.$transaction(
      settings.map((setting: { key: string; value: string }) =>
        prisma.system_settings.upsert({
          where: { settingKey: setting.key },
          update: {
            settingValue: setting.value === "********" ? undefined : setting.value,
            updatedAt: new Date(),
          },
          create: {
            settingKey: setting.key,
            settingValue: setting.value,
            settingType: "string",
            category: "sso",
            isEncrypted: encryptedKeys.includes(setting.key),
            updatedAt: new Date(),
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/settings/sso error:", error);
    return NextResponse.json(
      { error: "Failed to save SSO settings" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
