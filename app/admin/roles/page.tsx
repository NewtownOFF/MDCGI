import { createClient } from "@/lib/supabase/server";
import { setUserRole } from "@/lib/actions";
import { getSessionProfile } from "@/lib/session";
import {
  ROLE_LABELS,
  assignableRoles,
  type UserRole,
} from "@/lib/roles";

export default async function RolesAdminPage() {
  const supabase = createClient();
  const { profile: me } = await getSessionProfile();
  const callerRole = (me?.role ?? "inconnu") as UserRole;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, role, created_at")
    .order("created_at", { ascending: true });

  const options = assignableRoles(callerRole);

  return (
    <div className="container">
      <h1>Gérer les rôles</h1>
      <p className="muted">
        {callerRole === "gerant"
          ? "En tant que Gérant, vous pouvez attribuer tous les rôles, y compris Co-Gérant."
          : "En tant que Co-Gérant, vous pouvez attribuer Médecin, Médecin Distingué et Inconnu. Seul le Gérant peut nommer un Co-Gérant."}
      </p>

      <div className="card">
        {(profiles ?? []).map((p) => {
          async function updateRole(formData: FormData) {
            "use server";
            const newRole = String(formData.get("role")) as UserRole;
            await setUserRole(p.id, newRole);
          }

          const isUntouchable = p.role === "gerant";

          return (
            <div
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div>
                <strong>{p.username}</strong>{" "}
                <span className={`badge badge-${p.role}`}>{ROLE_LABELS[p.role as UserRole]}</span>
              </div>

              {isUntouchable ? (
                <span className="muted">Rôle Gérant immuable</span>
              ) : (
                <form action={updateRole} style={{ display: "flex", gap: 8 }}>
                  <select name="role" defaultValue={p.role} style={{ marginBottom: 0, width: 200 }}>
                    {options.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                  <button type="submit">Appliquer</button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
