import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PATCH /api/admin/users/[id]/permissions
export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { isadmin, canrequest } = body;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Build update data object with only provided fields
    const updateData = {};
    if (typeof isadmin === "boolean") {
      updateData.isadmin = isadmin;
    }
    if (typeof canrequest === "boolean") {
      updateData.canrequest = canrequest;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "At least one permission field (isadmin or canrequest) is required" },
        { status: 400 }
      );
    }

    updateData.change_date = new Date();

    const updatedUser = await prisma.user.update({
      where: { userid: id },
      data: updateData,
      select: {
        userid: true,
        username: true,
        firstname: true,
        lastname: true,
        email: true,
        isadmin: true,
        canrequest: true,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/admin/users/[id]/permissions error:", error);
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update user permissions" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
