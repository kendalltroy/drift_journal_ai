import { Auth, skipCSRFCheck } from '@auth/core';
import Credentials from '@auth/core/providers/credentials';
import { hash, verify } from 'argon2';
import postgres from 'postgres';
import NeonAdapter from '../../../../../__create/adapter';

let _adapter = null;

function getAdapter() {
  if (_adapter) return _adapter;
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const pgClient = postgres(process.env.DATABASE_URL);
  const pool = {
    query: async (sql, params) => {
      const result = await pgClient.unsafe(sql, params ?? []);
      return { rows: [...result], rowCount: result.length };
    },
  };
  _adapter = NeonAdapter(pool);
  return _adapter;
}

function buildAuthConfig() {
  const isSecure = process.env.AUTH_URL?.startsWith('https') ?? false;

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
    cookies: {
      csrfToken: { options: { secure: isSecure, sameSite: 'lax' } },
      sessionToken: { options: { secure: isSecure, sameSite: 'lax' } },
      callbackUrl: { options: { secure: isSecure, sameSite: 'lax' } },
    },
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
          const adapter = getAdapter();
          const user = await adapter.getUserByEmail(email);
          if (!user) return null;
          const matchingAccount = user.accounts.find((a) => a.provider === 'credentials');
          if (!matchingAccount?.password) return null;
          return (await verify(matchingAccount.password, password)) ? user : null;
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
        },
      }),
    ],
  };
}

async function handleAuth(request) {
  // No secret = return empty session (graceful, not a 500)
  if (!process.env.AUTH_SECRET) {
    return Response.json(null);
  }
  try {
    return await Auth(request, buildAuthConfig());
  } catch (err) {
    console.error('[auth] handler error:', err?.message ?? err);
    return Response.json({ error: 'Auth error' }, { status: 500 });
  }
}

export const loader = ({ request }) => handleAuth(request);
export const action = ({ request }) => handleAuth(request);
