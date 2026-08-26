import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { canPostFlex, type UserRole } from "@/lib/roles";
import AppShell from "@/components/AppShell";
import type { ReactNode } from "react";

export default async function NewFlexLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "inconnu") as UserRole;
  if (!canPostFlex(role)) redirect("/dashboard");

  return <AppShell>{children}</AppShell>;
}
