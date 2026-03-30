import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";

export async function GET() {
  await requireApiAdmin();
  throw new Error("Sentry test error — this is intentional");
}

export async function POST() {
  await requireApiAdmin();
  return NextResponse.json({
    message:
      "Sentry test: client-side error should be triggered from the browser",
  });
}
