"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewFlexPage() {
  const router = useRouter();
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [reanimations, setReanimations] = useState(0);
  const [soins, setSoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Merci d'ajouter un screen.");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("flex-photos")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("flex_posts").insert({
        user_id: user.id,
        image_path: path,
        reanimations,
        soins,
        status: "pending",
      });
      if (insertError) throw insertError;

      router.push("/flex");
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <h1>Nouveau Flex</h1>
      <p className="muted">
        Votre publication sera visible sur la page Flex uniquement après validation
        par un Gérant ou Co-Gérant Médecin.
      </p>
      <form onSubmit={handleSubmit} className="card">
        <label>Screen (nombres de réanimations / soins)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
        />
        <label>Nombre de réanimations</label>
        <input
          type="number"
          min={0}
          value={reanimations}
          onChange={(e) => setReanimations(parseInt(e.target.value) || 0)}
        />
        <label>Nombre de soins</label>
        <input
          type="number"
          min={0}
          value={soins}
          onChange={(e) => setSoins(parseInt(e.target.value) || 0)}
        />
        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Envoi..." : "Publier pour validation"}
        </button>
      </form>
    </div>
  );
}
