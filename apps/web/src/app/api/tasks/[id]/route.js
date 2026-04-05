import sql from "@/app/api/utils/sql";
import { getAuthUser } from "@/app/api/utils/getAuthUser";

/**
 * GET /api/tasks/[id] - Get a single task (only if it belongs to the user)
 */
export async function GET(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Only fetch if task belongs to this user
    const [task] = await sql`
      SELECT id, user_id, content, scheduled_time, completed, created_at
      FROM tasks 
      WHERE id = ${id} AND user_id = ${user.userId}
    `;

    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    return Response.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return Response.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

/**
 * PATCH /api/tasks/[id] - Update a task (only if it belongs to the user)
 */
export async function PATCH(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (body.content !== undefined) {
      if (body.content.length > 280) {
        return Response.json(
          { error: "Task content must be 280 characters or less" },
          { status: 400 },
        );
      }
      updates.push(`content = $${paramIndex++}`);
      values.push(body.content.trim());
    }

    if (body.scheduled_time !== undefined) {
      updates.push(`scheduled_time = $${paramIndex++}`);
      values.push(body.scheduled_time);
    }

    if (body.completed !== undefined) {
      updates.push(`completed = $${paramIndex++}`);
      values.push(body.completed);
    }

    if (updates.length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    // Add user_id and id to values
    values.push(user.userId);
    values.push(id);

    // Execute update - only if task belongs to this user
    const updateQuery = `
      UPDATE tasks 
      SET ${updates.join(", ")}
      WHERE user_id = $${paramIndex++} AND id = $${paramIndex}
      RETURNING id, user_id, content, scheduled_time, completed, created_at
    `;

    const [updatedTask] = await sql(updateQuery, values);

    if (!updatedTask) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    return Response.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return Response.json({ error: "Failed to update task" }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/[id] - Delete a task (only if it belongs to the user)
 */
export async function DELETE(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Only delete if task belongs to this user
    const [deletedTask] = await sql`
      DELETE FROM tasks 
      WHERE id = ${id} AND user_id = ${user.userId}
      RETURNING id
    `;

    if (!deletedTask) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    return Response.json({ success: true, id: deletedTask.id });
  } catch (error) {
    console.error("Error deleting task:", error);
    return Response.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
