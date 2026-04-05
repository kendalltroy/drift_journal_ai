import { getToken } from "@auth/core/jwt";

/**
 * Extract authenticated user from request (supports both web cookies and mobile JWT)
 * @param {Request} request - The incoming request object
 * @returns {Promise<{userId: string, email: string} | null>} - User info or null if not authenticated
 */
export async function getAuthUser(request) {
  try {
    // First, check for mobile JWT in Authorization header
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      // Verify and decode the JWT
      const jwt = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        secureCookie: false,
        raw: false,
        token, // Pass the token directly
      });

      if (jwt?.sub) {
        return {
          userId: jwt.sub,
          email: jwt.email || null,
          name: jwt.name || null,
        };
      }
    }

    // Fall back to cookie-based auth (web)
    const jwt = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.AUTH_URL?.startsWith("https") || false,
    });

    if (!jwt || !jwt.sub) {
      return null;
    }

    return {
      userId: jwt.sub,
      email: jwt.email || null,
      name: jwt.name || null,
    };
  } catch (error) {
    console.error("Error getting auth user:", error);
    return null;
  }
}

/**
 * Get authenticated user or throw 401 error
 * @param {Request} request - The incoming request object
 * @returns {Promise<{userId: string, email: string}>} - User info
 * @throws {Response} - 401 response if not authenticated
 */
export async function requireAuth(request) {
  const user = await getAuthUser(request);

  if (!user) {
    throw new Response(
      JSON.stringify({ error: "Unauthorized. Please sign in." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return user;
}
