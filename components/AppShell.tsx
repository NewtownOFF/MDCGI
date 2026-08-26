import Link from "next/link";
import { redirect } from "next/navigation";
import { ROLE_LABELS, isAdmin, canPostFlex, type UserRole } from "@/lib/roles";
import { getSessionProfile } from "@/lib/session";
import type { ReactNode } from "react";

export default async function AppShell({ children }: { children: ReactNode }) {
  const { userId, profile } = await getSessionProfile();
  if (!userId) redirect("/login");

  const role = (profile?.role ?? "inconnu") as UserRole;
  const admin = isAdmin(role);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 14c1.5-1.5 3-3.5 3-6a5 5 0 0 0-9-3 5 5 0 0 0-9 3c0 2.5 1.5 4.5 3 6l6 6 6-6Z" />
            </svg>
          </div>
          <div>
            <div className="brand-name">Médecin GI</div>
            <div className="brand-sub">DASHBOARD GI</div>
          </div>
        </div>

        <div className="nav-scroll">
          <Link href="/dashboard" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 11.5 12 4l9 7.5" />
              <path d="M5 10v10h14V10" />
            </svg>
            Accueil
          </Link>

          <div className="nav-group-head">
            <svg className="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m22 2-7 20-4-9-9-4Z" />
            </svg>
            Espace GI
          </div>
          <div className="nav-group-items">
            <Link href="/flex" className="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              Flex
            </Link>
            {canPostFlex(role) && (
              <Link href="/flex/new" className="nav-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Poster un Flex
              </Link>
            )}
            <Link href="/links" className="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2" />
                <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.2" />
              </svg>
              Liens utiles
            </Link>
          </div>

          {admin && (
            <>
              <div className="nav-group-head">
                <svg className="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5l-8-3Z" />
                </svg>
                Administration
              </div>
              <div className="nav-group-items">
                <Link href="/flex/admin" className="nav-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 11 3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  Validation Flex
                </Link>
                <Link href="/links/admin" className="nav-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                    <path d="M14 2v6h6M9 13h6M9 17h4" />
                  </svg>
                  Gérer les liens
                </Link>
                <Link href="/admin/roles" className="nav-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Gérer les rôles
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="avatar">{(profile?.username ?? "?").charAt(0).toUpperCase()}</div>
            <div className="user-meta">
              <div className="user-name">{profile?.username}</div>
              <div className="user-role">{ROLE_LABELS[role]}</div>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="foot-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
}
