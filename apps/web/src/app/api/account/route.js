import { supabase } from "@/app/api/utils/supabase";
import { requireAuth } from "@/app/api/utils/getAuthUser";
import { rateLimit } from "@/app/api/utils/rateLimit";

export async function DELETE(request) {
  const limited = rateLimit(request, { limit: 5, key: "account-delete" });
  if (limited) return limited;
  try {
    const user = await requireAuth(request);
    console.log("[deleteAccount] authed as", user.userId);

    // Delete all user data
    console.log("[deleteAccount] deleting journal + tasks...");
    const [journalResult, tasksResult] = await Promise.all([
      supabase.from("journal_entries").delete().eq("user_id", user.userId),
      supabase.from("tasks").delete().eq("user_id", user.userId),
    ]);

    if (journalResult.error) throw journalResult.error;
    if (tasksResult.error) throw tasksResult.error;
    console.log("[deleteAccount] journal + tasks deleted");

    // Delete the auth user (service role required)
    console.log("[deleteAccount] deleting auth user...");
    const { error: authError } = await supabase.auth.admin.deleteUser(user.userId);
    if (authError) throw authError;
    console.log("[deleteAccount] auth user deleted");

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error deleting account:", error);
    return Response.json({ error: "Failed to delete account" }, { status: 500 });
  }
}

export const action = ({ request, params }) => DELETE(request, { params });
