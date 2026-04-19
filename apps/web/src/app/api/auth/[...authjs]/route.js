import { Auth, skipCSRFCheck } from '@auth/core';
import { getToken } from '@auth/core/jwt';
import Credentials from '@auth/core/providers/credentials';
import { hash, verify } from 'argon2';
import postgres from 'postgres';
import NeonAdapter from '../../../../../__create/adapter';

let _adapter = null;

function getAdapter() {
  if (_adapter) return _adapter;
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  // prepare: false is required for Supabase transaction pooler (port 6543)
  const pgClient = postgres(process.env.DATABASE_URL, { prepare: false, ssl: 'require' });
  const pool = {
    query: async (sql, params) => {
      const result = await pgClient.unsafe(sql, params ?? []);
      return { rows: [...result], rowCount: result.length };
    },
  };
  _adapter = NeonAdapter(pool);
  return _adapter;
}

// Handle GET /api/auth/session manually — bypasses assertConfig entirely.
// The mobile app and web app both rely on JWT cookies; no DB needed here.
async function handleSession(request) {
  // Derive security from the actual request URL, not AUTH_URL env var.
  // Vercel always serves HTTPS so this correctly picks __Secure-* cookie names.
  const isSecure = new URL(request.url).protocol === 'https:';
  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: isSecure,
    });
    if (!token) return Response.json(null);
    return Response.json({
      user: {
        id: token.sub,
        email: token.email,
        name: token.name,
        image: token.picture,
      },
      expires: new Date(Number(token.exp) * 1000).toISOString(),
    });
  } catch (err) {
    console.error('[auth/session] error:', err?.message ?? err);
    return Response.json(null);
  }
}

function buildAuthConfig() {
  return {
    secret: process.env.AUTH_SECRET,
    basePath: '/api/auth',
    trustHost: true,
    pages: {
      signIn: '/account/signin',
      signOut: '/account/logout',
    },
    skipCSRFCheck,
    session: { strategy: 'jwt' },
    callbacks: {
      session({ session, token }) {
        if (token.sub) session.user.id = token.sub;
        return session;
      },
    },
    // No explicit cookie overrides — Auth.js auto-detects secure/prefix
    // from the request URL (https: → __Secure-* prefix). This matches
    // what handleSession does when reading the token with getToken().
    providers: [
      Credentials({
        id: 'credentials-signin',
        name: 'Credentials Sign in',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        authorize: async (credentials) => {
          const { email, password } = credentials;
          if (!email || !password) return null;
          if (typeof email !== 'string' || typeof password !== 'string') return null;
          try {
            const adapter = getAdapter();
            const user = await adapter.getUserByEmail(email);
            if (!user) return null;
            const matchingAccount = user.accounts.find((a) => a.provider === 'credentials');
            if (!matchingAccount?.password) return null;
            return (await verify(matchingAccount.password, password)) ? user : null;
          } catch (err) {
            console.error('[auth/signin] authorize threw:', err?.message ?? err);
            throw err;
          }
        },
      }),
      Credentials({
        id: 'credentials-signup',
        name: 'Credentials Sign up',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
          name: { label: 'Name', type: 'text' },
          image: { label: 'Image', type: 'text', required: false },
        },
        authorize: async (credentials) => {
          const { email, password, name, image } = credentials;
          if (!email || !password) return null;
          if (typeof email !== 'string' || typeof password !== 'string') return null;
          try {
            const adapter = getAdapter();
            const existing = await adapter.getUserByEmail(email);
            if (existing) return null;
            const newUser = await adapter.createUser({
              emailVerified: null,
              email,
              name: typeof name === 'string' && name.length > 0 ? name : null,
              image: typeof image === 'string' && image.length > 0 ? image : null,
            });
            await adapter.linkAccount({
              extraData: { password: await hash(password) },
              type: 'credentials',
              userId: newUser.id,
              providerAccountId: newUser.id,
              provider: 'credentials',
            });
            return newUser;
          } catch (err) {
            console.error('[auth/signup] authorize threw:', err?.message ?? err);
            throw err;
          }
        },
      }),
    ],
  };
}

async function handleAuth(request) {
  console.log('[auth] AUTH_SECRET set:', !!process.env.AUTH_SECRET, 'len:', process.env.AUTH_SECRET?.length);
  try {
    const dbHost = new URL(process.env.DATABASE_URL ?? '').hostname;
    console.log('[auth] DATABASE_URL host:', dbHost);
  } catch (e) {
    console.log('[auth] DATABASE_URL parse error:', e.message);
    console.log('[auth] DATABASE_URL prefix:', JSON.stringify(process.env.DATABASE_URL?.slice(0, 40)));
    console.log('[auth] DATABASE_URL length:', process.env.DATABASE_URL?.length);
  }
  if (!process.env.AUTH_SECRET) return Response.json(null);

  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const action = segments[segments.length - 1];

  // /api/auth/session — handle directly to avoid assertConfig failures
  if (request.method === 'GET' && action === 'session') {
    return handleSession(request);
  }

  try {
    return await Auth(request, {
      ...buildAuthConfig(),
      logger: {
        error(code, ...message) {
          console.error('[auth/logger] error code:', code, ...message);
        },
        warn(code) {
          console.warn('[auth/logger] warn code:', code);
        },
      },
    });
  } catch (err) {
    console.error('[auth] error:', err?.message ?? err);
    return Response.json({ error: 'Auth error' }, { status: 500 });
  }
}

export const loader = ({ request }) => handleAuth(request);
export const action = ({ request }) => handleAuth(request);
