import sql from "@/app/api/utils/sql";
import { getAuthUser } from "@/app/api/utils/getAuthUser";

/**
 * GET /api/tasks - List all tasks for authenticated user
 */
export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only fetch tasks that belong to this user
    const tasks = await sql`
      SELECT id, user_id, content, scheduled_time, completed, created_at
      FROM tasks 
      WHERE user_id = ${user.userId}
      ORDER BY scheduled_time ASC NULLS LAST, created_at DESC
    `;

    return Response.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return Response.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

/**
 * POST /api/tasks - Create a new task for authenticated user
 */
export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, scheduled_time } = body;

    // Validate content
    if (!content || content.trim().length === 0) {
      return Response.json(
        { error: "Task content is required" },
        { status: 400 },
      );
    }

    if (content.length > 280) {
      return Response.json(
        { error: "Task content must be 280 characters or less" },
        { status: 400 },
      );
    }

    // Create task for this user
    const [newTask] = await sql`
      INSERT INTO tasks (user_id, content, scheduled_time)
      VALUES (${user.userId}, ${content.trim()}, ${scheduled_time || null})
      RETURNING id, user_id, content, scheduled_time, completed, created_at
    `;

    return Response.json(newTask);
  } catch (error) {
    console.error("Error creating task:", error);
    return Response.json({ error: "Failed to create task" }, { status: 500 });
  }
}
