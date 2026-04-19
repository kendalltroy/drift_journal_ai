'use client';

import { useSession, signOut } from '@auth/create/react';

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
          Welcome{session?.user?.name ? `, ${session.user.name}` : ''}
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>You are signed in as {session?.user?.email}</p>
        <button
          onClick={() => signOut({ callbackUrl: '/account/signin' })}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#111827', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
