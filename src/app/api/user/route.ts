import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";
import { updateUserSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/auth-utils";

const stripPassword = (user) => {
  if (!user) return user;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = user;
  return rest;
};

// GET /api/user
// Optional query: ?id=<userid>
export async function GET(req) {
  try {
    const authUser = await requireApiAuth();
    const id = req.nextUrl.searchParams.get("id");
    if (id) {
      if (!authUser.isAdmin && authUser.id !== id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const user = await prisma.user.findUnique({ where: { userid: id } });
      if (!user) {
        return NextResponse.json(
          { error: `User with id ${id} not found` },
          { status: 404 }
        );
      }
      return NextResponse.json(stripPassword(user), { status: 200 });
    }

    if (!authUser.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({});
    return NextResponse.json(users.map(stripPassword), { status: 200 });
  } catch (error) {
    console.error("GET /api/user error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// PUT /api/user
// Body must include userid; any provided fields will be updated
export async function PUT(req) {
  try {
    const authUser = await requireApiAuth();
    const body = await req.json();
    const { userid, password, ...data } = body || {};

    if (!userid) {
      return NextResponse.json(
        { error: "userid is required to update a user" },
        { status: 400 }
      );
    }

    if (!authUser.isAdmin && authUser.id !== userid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const schema = authUser.isAdmin
      ? updateUserSchema
      : updateUserSchema.omit({ isadmin: true, canrequest: true });

    const validationResult = schema.strict().safeParse({
      ...data,
      ...(typeof password === "string" && password.length > 0 ? { password } : {}),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const updateData = { ...validationResult.data } as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(updateData, "password")) {
      updateData.password = await hashPassword(updateData.password as string);
    }

    const updated = await prisma.user.update({
      where: { userid },
      data: {
        ...updateData,
        change_date: new Date(),
      },
    });
    return NextResponse.json(stripPassword(updated), { status: 200 });
  } catch (error) {
    console.error("PUT /api/user error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
