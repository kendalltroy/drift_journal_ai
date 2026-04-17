import { supabase } from "@/app/api/utils/supabase";
import { getAuthUser } from "@/app/api/utils/getAuthUser";
import { rateLimit } from "@/app/api/utils/rateLimit";

export async function GET(request) {
  const limited = rateLimit(request, { key: "tasks" });
  if (limited) return limited;
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("id, user_id, content, scheduled_time, completed, created_at")
      .eq("user_id", user.userId)
      .order("scheduled_time", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return Response.json(data);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return Response.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request) {
  const limited = rateLimit(request, { key: "tasks" });
  if (limited) return limited;
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, scheduled_time } = body;

    if (!content || content.trim().length === 0) {
      return Response.json({ error: "Task content is required" }, { status: 400 });
    }

    if (content.length > 280) {
      return Response.json({ error: "Task content must be 280 characters or less" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert({ user_id: user.userId, content: content.trim(), scheduled_time: scheduled_time || null })
      .select("id, user_id, content, scheduled_time, completed, created_at")
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch (error) {
    console.error("Error creating task:", error);
    return Response.json({ error: "Failed to create task" }, { status: 500 });
  }
}
