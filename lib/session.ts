import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/roles";

export type SessionProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  role: UserRole;
} | null;

/**
 * Récupère l'utilisateur connecté + son profil, une seule fois par requête.
 *
 * `cache()` de React dédoublonne les appels identiques au sein d'un même rendu
 * serveur : que ce soit AppShell, un layout de garde, ou la page elle-même qui
 * l'appellent, une seule requête part vers Supabase au lieu d'une par appelant.
 * Le cache est réinitialisé à chaque nouvelle requête HTTP (pas de fuite entre
 * utilisateurs).
 */
export const getSessionProfile = cache(async (): Promise<{
  userId: string | null;
  profile: SessionProfile;
}> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { userId: null, profile: null };

  const { data } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, role")
    .eq("id", user.id)
    .single();

  return { userId: user.id, profile: (data as SessionProfile) ?? null };
});
