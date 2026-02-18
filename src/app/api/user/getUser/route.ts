import prisma from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";

const stripPassword = (user) => {
  if (!user) return user;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = user;
  return rest;
};

export async function GET() {
  try {
    await requireApiAdmin();
    const users = await prisma.user.findMany();
    return NextResponse.json(users.map(stripPassword));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
