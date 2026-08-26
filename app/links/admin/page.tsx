import { createClient } from "@/lib/supabase/server";
import { createLink, deleteLink } from "@/lib/actions";

export default async function LinksAdminPage() {
  const supabase = createClient();
  const { data: links } = await supabase
    .from("links")
    .select("id, title, url, created_at")
    .order("created_at", { ascending: false });

  async function handleCreate(formData: FormData) {
    "use server";
    const title = String(formData.get("title") ?? "");
    const url = String(formData.get("url") ?? "");
    if (title && url) await createLink(title, url);
  }

  return (
    <div className="container" style={{ maxWidth: 600 }}>
      <h1>Gérer les liens utiles</h1>

      <form action={handleCreate} className="card">
        <label>Titre</label>
        <input name="title" required placeholder="Ex: Règlement interne" />
        <label>URL</label>
        <input name="url" required placeholder="https://..." />
        <button type="submit">Ajouter le lien</button>
      </form>

      <div className="card">
        {(links ?? []).map((link) => {
          async function remove() {
            "use server";
            await deleteLink(link.id);
          }
          return (
            <div
              key={link.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div>
                <strong>{link.title}</strong>
                <div className="muted">{link.url}</div>
              </div>
              <form action={remove}>
                <button type="submit" className="btn-danger">Supprimer</button>
              </form>
            </div>
          );
        })}
        {(!links || links.length === 0) && <p className="muted">Aucun lien pour l'instant.</p>}
      </div>
    </div>
  );
}
