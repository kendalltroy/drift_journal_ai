import sql from "@/app/api/utils/sql";
import { getAuthUser } from "@/app/api/utils/getAuthUser";

export async function GET(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const [entry] = await sql`
      SELECT id, emotion, mode, prompt, summary, sentiment_score, tags, created_at, generated_at, user_id, ai_prompts
      FROM journal_entries
      WHERE id = ${id} AND user_id = ${user.userId}
    `;

    if (!entry) {
      return Response.json({ error: "Entry not found" }, { status: 404 });
    }

    return Response.json(entry);
  } catch (error) {
    console.error("Error fetching entry:", error);
    return Response.json({ error: "Failed to fetch entry" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const [deleted] = await sql`
      DELETE FROM journal_entries
      WHERE id = ${id} AND user_id = ${user.userId}
      RETURNING id
    `;

    if (!deleted) {
      return Response.json({ error: "Entry not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting entry:", error);
    return Response.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
