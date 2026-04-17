import { supabase } from "@/app/api/utils/supabase";
import { getAuthUser } from "@/app/api/utils/getAuthUser";
import { rateLimit } from "@/app/api/utils/rateLimit";

export async function GET(request, { params }) {
  const limited = rateLimit(request, { key: "tasks-id" });
  if (limited) return limited;
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const { data, error } = await supabase
      .from("tasks")
      .select("id, user_id, content, scheduled_time, completed, created_at")
      .eq("id", id)
      .eq("user_id", user.userId)
      .single();

    if (error || !data) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    return Response.json(data);
  } catch (error) {
    console.error("Error fetching task:", error);
    return Response.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const limited = rateLimit(request, { key: "tasks-id" });
  if (limited) return limited;
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const updates = {};

    if (body.content !== undefined) {
      if (body.content.length > 280) {
        return Response.json({ error: "Task content must be 280 characters or less" }, { status: 400 });
      }
      updates.content = body.content.trim();
    }

    if (body.scheduled_time !== undefined) updates.scheduled_time = body.scheduled_time;
    if (body.completed !== undefined) updates.completed = body.completed;

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.userId)
      .select("id, user_id, content, scheduled_time, completed, created_at")
      .single();

    if (error || !data) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    return Response.json(data);
  } catch (error) {
    console.error("Error updating task:", error);
    return Response.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const limited = rateLimit(request, { key: "tasks-id" });
  if (limited) return limited;
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const { data, error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.userId)
      .select("id")
      .single();

    if (error || !data) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    return Response.json({ success: true, id: data.id });
  } catch (error) {
    console.error("Error deleting task:", error);
    return Response.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
