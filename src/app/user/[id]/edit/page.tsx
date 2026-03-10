import React from "react";
import { getUserById } from "@/lib/data";
import { requireAuth } from "@/lib/auth-guards";
import UserEditForm from "./ui/UserEditForm";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const [user, session] = await Promise.all([
    getUserById(params.id),
    requireAuth(),
  ]);
  return <UserEditForm initial={user} isAdmin={!!session.user.isAdmin} />;
}
