import AppShell from "@/components/AppShell";
import FlexCard from "@/components/FlexCard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";

export default async function FlexPage() {
  const { userId } = await getSessionProfile();
  if (!userId) redirect("/login");
  const supabase = createClient();

  const { data: posts } = await supabase
    .from("flex_posts")
    .select("id, image_path, reanimations, soins, created_at, profiles(username)")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  return (
    <AppShell>
      <div className="container">
        <h1>Flex</h1>
        <p className="muted">Publications validées par les Gérants Médecin.</p>

        <div className="grid">
          {(posts ?? []).map((post: any) => {
            const { data: img } = supabase.storage
              .from("flex-photos")
              .getPublicUrl(post.image_path);
            return (
              <FlexCard
                key={post.id}
                imageUrl={img.publicUrl}
                username={post.profiles?.username ?? "Inconnu"}
                reanimations={post.reanimations}
                soins={post.soins}
                createdAt={post.created_at}
              />
            );
          })}
          {(!posts || posts.length === 0) && (
            <p className="muted">Aucune publication validée pour l'instant.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
