import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { hasPermission, hasAnyPermission, type Permission } from "./rbac";
import prisma from "./prisma";

/**
 * Block mutating operations in demo mode.
 * Returns a 403 response if DEMO_MODE is enabled, null otherwise.
 */
export function requireNotDemoMode() {
  if (process.env.DEMO_MODE === "true") {
    return NextResponse.json(
      { error: "This action is disabled in demo mode" },
      { status: 403 },
    );
  }
  return null;
}

export interface AuthUser {
  id?: string;
  isAdmin?: boolean;
  canRequest?: boolean;
  name?: string | null;
  email?: string | null;
  username?: string;
  firstname?: string;
  lastname?: string;
  organizationId?: string;
}

/**
 * Get authenticated user from session.
 * Fetches custom fields from Prisma since BetterAuth sessions
 * only store standard fields.
 */
export async function getAuthUser(): Promise<AuthUser> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  // Fetch custom user fields from DB
  const dbUser = await prisma.user.findUnique({
    where: { userid: session.user.id },
    select: {
      userid: true,
      username: true,
      firstname: true,
      lastname: true,
      email: true,
      isadmin: true,
      canrequest: true,
      organizationId: true,
      isActive: true,
    },
  });

  if (!dbUser || !dbUser.isActive) {
    throw new Error("Unauthorized");
  }

  return {
    id: dbUser.userid,
    name: `${dbUser.firstname} ${dbUser.lastname}`,
    email: dbUser.email,
    username: dbUser.username || undefined,
    firstname: dbUser.firstname,
    lastname: dbUser.lastname,
    isAdmin: dbUser.isadmin,
    canRequest: dbUser.canrequest,
    organizationId: dbUser.organizationId || undefined,
  };
}

/**
 * Require authentication for API routes
 */
export async function requireApiAuth(): Promise<AuthUser> {
  return await getAuthUser();
}

/**
 * Require admin role for API routes
 */
export async function requireApiAdmin(): Promise<AuthUser> {
  const user = await getAuthUser();

  if (!user.isAdmin) {
    throw new Error("Forbidden: Admin access required");
  }

  return user;
}

/**
 * Check if user has request permission
 */
export async function requireApiCanRequest(): Promise<AuthUser> {
  const user = await getAuthUser();

  if (!user.canRequest && !user.isAdmin) {
    throw new Error("Forbidden: Request permission required");
  }

  return user;
}

/**
 * Require specific permission(s) for API routes
 * Checks RBAC permissions via user roles. Admin users pass all checks.
 */
export async function requirePermission(
  ...permissions: Permission[]
): Promise<AuthUser> {
  const user = await getAuthUser();

  if (!user.id) {
    throw new Error("Unauthorized");
  }

  // Admin users bypass permission checks
  if (user.isAdmin) {
    return user;
  }

  const hasAccess =
    permissions.length === 1
      ? await hasPermission(user.id, permissions[0])
      : await hasAnyPermission(user.id, permissions);

  if (!hasAccess) {
    throw new Error("Forbidden: Insufficient permissions");
  }

  return user;
}
