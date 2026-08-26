import { redirect } from "next/navigation";
import { canPostFlex, type UserRole } from "@/lib/roles";
import { getSessionProfile } from "@/lib/session";
import AppShell from "@/components/AppShell";
import type { ReactNode } from "react";

export default async function NewFlexLayout({ children }: { children: ReactNode }) {
  const { userId, profile } = await getSessionProfile();
  if (!userId) redirect("/login");

  const role = (profile?.role ?? "inconnu") as UserRole;
  if (!canPostFlex(role)) redirect("/dashboard");

  return <AppShell>{children}</AppShell>;
}
