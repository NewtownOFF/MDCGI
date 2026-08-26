import AppShell from "@/components/AppShell";
import AnnouncementCenter from "@/components/AnnouncementCenter";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin, type UserRole } from "@/lib/roles";
import { getSessionProfile } from "@/lib/session";

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default async function DashboardPage() {
  const { userId, profile } = await getSessionProfile();
  if (!userId) redirect("/login");
  const supabase = createClient();

  const role = (profile?.role ?? "inconnu") as UserRole;
  const admin = isAdmin(role);

  const [
    { count: totalAccounts },
    { count: approvedCount },
    { count: pendingCount },
    { count: linksCount },
    { count: adminPendingCount },
    { data: announcementsRaw },
    { data: readsRaw },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("flex_posts").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "approved"),
    supabase.from("flex_posts").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "pending"),
    supabase.from("links").select("*", { count: "exact", head: true }),
    admin
      ? supabase.from("flex_posts").select("*", { count: "exact", head: true }).eq("status", "pending")
      : Promise.resolve({ count: 0 } as any),
    supabase
      .from("announcements")
      .select("id, title, body, pinned, created_at, profiles(username)")
      .order("created_at", { ascending: false }),
    supabase.from("announcement_reads").select("announcement_id").eq("user_id", userId),
  ]);

  const announcements = (announcementsRaw ?? []).map((a: any) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    pinned: a.pinned,
    created_at: a.created_at,
    author: a.profiles?.username ?? "Inconnu",
  }));
  const readIds = new Set((readsRaw ?? []).map((r: any) => r.announcement_id));
  const unreadIds = announcements.filter((a) => !readIds.has(a.id)).map((a) => a.id);

  const now = new Date();
  const dateLabel = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <AppShell>
      <div className="page-wrap">
        <div className="topline">
          <div>
            <div className="eyebrow">Menu principal</div>
            <h1 className="page-title">Accueil</h1>
            <p className="page-sub">Retrouvez vos informations importantes et vos raccourcis.</p>
          </div>
        </div>

        <section className="hero">
          <div>
            <div className="hero-date">{dateLabel}</div>
            <h2 className="hero-greet">{greeting()}, {profile?.username}</h2>
            <p className="hero-desc">Voici les informations importantes de votre espace Médecin GI.</p>
          </div>
          <div className="hero-avatar">{(profile?.username ?? "?").charAt(0).toUpperCase()}</div>
        </section>

        <section className="stats-row">
          <div className="stat-card">
            <div className="stat-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div className="stat-num">{totalAccounts ?? 0}</div>
              <div className="stat-label">Comptes actifs</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <div>
              <div className="stat-num">{approvedCount ?? 0}</div>
              <div className="stat-label">Flex validés</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div>
              <div className="stat-num">{pendingCount ?? 0}</div>
              <div className="stat-label">Mes Flex en attente</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2" />
                <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.2" />
              </svg>
            </div>
            <div>
              <div className="stat-num">{admin ? adminPendingCount ?? 0 : linksCount ?? 0}</div>
              <div className="stat-label">{admin ? "Flex à valider" : "Liens utiles"}</div>
            </div>
          </div>
        </section>

        <AnnouncementCenter announcements={announcements} initialUnreadIds={unreadIds} isAdmin={admin} />
      </div>
    </AppShell>
  );
}
