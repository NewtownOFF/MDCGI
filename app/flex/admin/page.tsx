import FlexCard from "@/components/FlexCard";
import { createClient } from "@/lib/supabase/server";
import { reviewFlexPost } from "@/lib/actions";

export default async function FlexAdminPage() {
  const supabase = createClient();

  const { data: posts } = await supabase
    .from("flex_posts")
    .select("id, image_path, reanimations, soins, created_at, status, profiles(username)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="container">
      <h1>Validation des Flex</h1>
      <p className="muted">Publications en attente d'approbation.</p>

      <div className="grid">
        {(posts ?? []).map((post: any) => {
          const { data: img } = supabase.storage
            .from("flex-photos")
            .getPublicUrl(post.image_path);

          async function approve() {
            "use server";
            await reviewFlexPost(post.id, "approved");
          }
          async function reject() {
            "use server";
            await reviewFlexPost(post.id, "rejected");
          }

          return (
            <FlexCard
              key={post.id}
              imageUrl={img.publicUrl}
              username={post.profiles?.username ?? "Inconnu"}
              reanimations={post.reanimations}
              soins={post.soins}
              createdAt={post.created_at}
              status={post.status}
              actions={
                <>
                  <form action={approve}>
                    <button type="submit" className="btn-success">Valider</button>
                  </form>
                  <form action={reject}>
                    <button type="submit" className="btn-danger">Rejeter</button>
                  </form>
                </>
              }
            />
          );
        })}
        {(!posts || posts.length === 0) && (
          <p className="muted">Aucune publication en attente.</p>
        )}
      </div>
    </div>
  );
}
