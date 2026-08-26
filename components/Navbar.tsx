import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROLE_LABELS, isAdmin, canPostFlex, type UserRole } from "@/lib/roles";

export default async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url, role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "inconnu") as UserRole;

  return (
    <nav className="navbar">
      <div className="navbar-links">
        <Link href="/dashboard"><strong>Médecin GI</strong></Link>
        <Link href="/flex">Flex</Link>
        {canPostFlex(role) && <Link href="/flex/new">Poster</Link>}
        {isAdmin(role) && <Link href="/flex/admin">Validation</Link>}
        <Link href="/links">Liens utiles</Link>
        {isAdmin(role) && <Link href="/links/admin">Gérer les liens</Link>}
        {isAdmin(role) && <Link href="/admin/roles">Gérer les rôles</Link>}
      </div>
      <div className="navbar-links">
        <span className={`badge badge-${role}`}>{ROLE_LABELS[role]}</span>
        <span className="muted">{profile?.username}</span>
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn-muted">Déconnexion</button>
        </form>
      </div>
    </nav>
  );
}
