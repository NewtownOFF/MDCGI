"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/lib/roles";

export async function reviewFlexPost(postId: string, decision: "approved" | "rejected") {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");

  // La policy RLS "flex_update_admins" bloque cette requête si l'appelant
  // n'est pas gerant/co_gerant — pas besoin de revérifier ici, mais on le fait
  // quand même pour renvoyer une erreur claire côté UI.
  const { error } = await supabase
    .from("flex_posts")
    .update({ status: decision, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", postId);

  if (error) throw new Error(error.message);

  revalidatePath("/flex/admin");
  revalidatePath("/flex");
}

export async function createLink(title: string, url: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");

  let normalizedUrl = url.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  const { error } = await supabase.from("links").insert({
    title: title.trim(),
    url: normalizedUrl,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/links");
  revalidatePath("/links/admin");
}

export async function deleteLink(linkId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("links").delete().eq("id", linkId);
  if (error) throw new Error(error.message);
  revalidatePath("/links");
  revalidatePath("/links/admin");
}

export async function setUserRole(userId: string, newRole: UserRole) {
  const supabase = createClient();
  const { error } = await supabase.rpc("admin_set_role", {
    p_user_id: userId,
    p_new_role: newRole,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/roles");
}
