// In-memory rate limiter using a fixed window per IP.
// For multi-instance deployments, replace the store with Redis/Upstash.

const store = new Map(); // key -> { count, resetAt }

function getIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Check rate limit for a request.
 * @param {Request} request
 * @param {object} options
 * @param {number} options.limit      - Max requests per window (default 60)
 * @param {number} options.windowMs   - Window in ms (default 15 minutes)
 * @param {string} options.key        - Optional key suffix to namespace (e.g. route name)
 * @returns {Response|null}           - 429 Response if limited, null if ok
 */
export function rateLimit(request, { limit = 60, windowMs = 15 * 60 * 1000, key = "" } = {}) {
  const ip = getIp(request);
  const storeKey = `${ip}:${key}`;
  const now = Date.now();

  const entry = store.get(storeKey);

  if (!entry || now > entry.resetAt) {
    store.set(storeKey, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count += 1;

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return Response.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}

// Prune stale entries every 15 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 15 * 60 * 1000);
