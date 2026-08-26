import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";

export default async function LinksPage() {
  const { userId } = await getSessionProfile();
  if (!userId) redirect("/login");
  const supabase = createClient();

  const { data: links } = await supabase
    .from("links")
    .select("id, title, url, created_at")
    .order("created_at", { ascending: false });

  return (
    <AppShell>
      <div className="container">
        <h1>Liens utiles</h1>
        <div className="card">
          {(links ?? []).map((link) => (
            <div key={link.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.title}
              </a>
            </div>
          ))}
          {(!links || links.length === 0) && <p className="muted">Aucun lien pour l'instant.</p>}
        </div>
      </div>
    </AppShell>
  );
}
