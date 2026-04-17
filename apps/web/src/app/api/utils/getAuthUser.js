import { createClient } from "@supabase/supabase-js";

/**
 * Validates the Bearer token from the request using a request-scoped
 * anon client with the user's JWT in the Authorization header.
 * The service role client is NOT used here — only for privileged ops elsewhere.
 */
export async function getAuthUser(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.substring(7);

    const userClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const { data: { user }, error } = await userClient.auth.getUser(token);

    if (error || !user) {
      console.error("[getAuthUser] error:", error?.message);
      return null;
    }

    return {
      userId: user.id,
      email: user.email || null,
      name: user.user_metadata?.name || null,
    };
  } catch (error) {
    console.error("Error getting auth user:", error);
    return null;
  }
}

export async function requireAuth(request) {
  const user = await getAuthUser(request);
  if (!user) {
    throw new Response(
      JSON.stringify({ error: "Unauthorized. Please sign in." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  return user;
}
