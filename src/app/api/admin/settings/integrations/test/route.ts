import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, webhookUrl, channel } = body;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Webhook URL is required" },
        { status: 400 },
      );
    }

    let payload: unknown;

    if (type === "slack") {
      payload = {
        text: "Test notification from Asset Tracker",
        ...(channel ? { channel } : {}),
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*Asset Tracker - Test Notification*\nThis is a test message to verify your Slack integration is working correctly.",
            },
          },
        ],
      };
    } else if (type === "teams") {
      payload = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        themeColor: "0076D7",
        summary: "Asset Tracker - Test Notification",
        sections: [
          {
            activityTitle: "Asset Tracker - Test Notification",
            activitySubtitle:
              "This is a test message to verify your Microsoft Teams integration is working correctly.",
            markdown: true,
          },
        ],
      };
    } else {
      return NextResponse.json(
        { error: "Invalid integration type" },
        { status: 400 },
      );
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return NextResponse.json(
        { error: `Webhook returned ${response.status}: ${errorText}` },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("POST /api/admin/settings/integrations/test error", { error });
    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
