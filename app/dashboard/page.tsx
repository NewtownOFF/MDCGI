import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROLE_LABELS, type UserRole } from "@/lib/roles";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, role, created_at")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "inconnu") as UserRole;

  const { count: approvedCount } = await supabase
    .from("flex_posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "approved");

  const { count: pendingCount } = await supabase
    .from("flex_posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "pending");

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>Bienvenue, {profile?.username}</h1>
        <p className="muted">Rôle actuel : <strong>{ROLE_LABELS[role]}</strong></p>

        {role === "inconnu" && (
          <div className="card">
            <strong>Compte en attente d'un rôle.</strong>
            <p className="muted">Un Gérant ou Co-Gérant Médecin doit vous attribuer un rôle avant que vous puissiez poster sur Flex.</p>
          </div>
        )}

        <div className="stat-row">
          <div className="stat">
            <div className="n">{approvedCount ?? 0}</div>
            <div className="l">Flex validés</div>
          </div>
          <div className="stat">
            <div className="n">{pendingCount ?? 0}</div>
            <div className="l">En attente</div>
          </div>
        </div>
      </div>
    </>
  );
}
