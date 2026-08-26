"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  async function signInWithDiscord() {
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="container" style={{ display: "flex", minHeight: "80vh", alignItems: "center", justifyContent: "center" }}>
      <div className="card" style={{ textAlign: "center", maxWidth: 380 }}>
        <h1>Médecin GI</h1>
        <p className="muted">Dashboard réservé aux Médecins GI. Connexion via Discord uniquement.</p>
        <button onClick={signInWithDiscord} style={{ width: "100%", marginTop: 12 }}>
          Se connecter avec Discord
        </button>
      </div>
    </div>
  );
}
