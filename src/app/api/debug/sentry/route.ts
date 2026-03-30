import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";

export async function GET() {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  throw new Error("Sentry test error — this is intentional");
}

export async function POST() {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  return NextResponse.json({
    message:
      "Sentry test: client-side error should be triggered from the browser",
  });
}
