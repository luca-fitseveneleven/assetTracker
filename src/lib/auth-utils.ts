import bcrypt from "bcryptjs";
import type { Prisma, PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";

/**
 * Hash a password using bcrypt with 12 rounds
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hashed password
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Atomically set a user's password in both `user.password` (legacy column)
 * and `accounts.password` for the BetterAuth credential provider.
 *
 * BetterAuth verifies passwords against `accounts.password` (see
 * `auth-server.ts` `account.fields.password`). Writing only to `user.password`
 * is silently ignored — the legacy column exists only for the NextAuth → BetterAuth
 * migration path in the auth `before` hook.
 *
 * Always use this helper instead of writing to either column directly. It hashes
 * the password internally so callers cannot accidentally store plaintext.
 *
 * @param userId  The userid of the user whose password is being set
 * @param plaintextPassword  The new password in plaintext (minimum length is enforced
 *                           by callers via Zod schemas — this function does not validate length)
 * @param tx  Optional Prisma transaction client. If provided, the writes happen
 *            inside the caller's transaction. If omitted, a new transaction is opened.
 */
export async function setUserPassword(
  userId: string,
  plaintextPassword: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const hashedPassword = await hashPassword(plaintextPassword);
  await writeCredentialPassword(userId, hashedPassword, tx);
}

/**
 * Lower-level variant for callers that already hold a hashed password — used by
 * cron seeders and bulk imports that hash a single password and reuse it across
 * many user creates. Prefer `setUserPassword` for normal flows.
 */
export async function setUserPasswordHashed(
  userId: string,
  hashedPassword: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  await writeCredentialPassword(userId, hashedPassword, tx);
}

async function writeCredentialPassword(
  userId: string,
  hashedPassword: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const run = async (client: Prisma.TransactionClient | PrismaClient) => {
    await client.user.update({
      where: { userid: userId },
      data: { password: hashedPassword, change_date: new Date() },
    });
    await client.accounts.upsert({
      where: {
        providerId_accountId: {
          providerId: "credential",
          accountId: userId,
        },
      },
      update: { password: hashedPassword, updatedAt: new Date() },
      create: {
        userId,
        providerId: "credential",
        accountId: userId,
        password: hashedPassword,
      },
    });
  };

  if (tx) {
    await run(tx);
  } else {
    await prisma.$transaction(run);
  }
}
