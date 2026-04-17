import { supabase } from "@/app/api/utils/supabase";
import { getAuthUser } from "@/app/api/utils/getAuthUser";
import { rateLimit } from "@/app/api/utils/rateLimit";

export async function GET(request, { params }) {
  const limited = rateLimit(request, { key: "journal-id" });
  if (limited) return limited;
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const { data, error } = await supabase
      .from("journal_entries")
      .select("id, emotion, mode, prompt, summary, sentiment_score, tags, created_at, generated_at, user_id, ai_prompts")
      .eq("id", id)
      .eq("user_id", user.userId)
      .single();

    if (error || !data) {
      return Response.json({ error: "Entry not found" }, { status: 404 });
    }

    return Response.json(data);
  } catch (error) {
    console.error("Error fetching entry:", error);
    return Response.json({ error: "Failed to fetch entry" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const limited = rateLimit(request, { key: "journal-id" });
  if (limited) return limited;
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const { data, error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.userId)
      .select("id")
      .single();

    if (error || !data) {
      return Response.json({ error: "Entry not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting entry:", error);
    return Response.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
