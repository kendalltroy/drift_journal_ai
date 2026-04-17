import { useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { useAuthModal, useAuthStore, authKey } from './store';
import { isTokenExpired } from './tokenUtils';

export const useAuth = () => {
  const { isReady, auth, setAuth } = useAuthStore();
  const { close, open } = useAuthModal();

  const initiate = useCallback(async () => {
    const stored = await AsyncStorage.getItem(authKey);

    if (!stored) {
      useAuthStore.setState({ auth: null, isReady: true });
      return;
    }

    try {
      // getSession reads from AsyncStorage (full session including refresh_token)
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.refresh_token) {
        // setSession handles refresh if access_token is expired
        const { data, error } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        if (!error && data.session && !isTokenExpired(data.session.access_token)) {
          useAuthStore.setState({
            auth: { jwt: data.session.access_token, user: data.session.user },
            isReady: true,
          });
          return;
        }
      }
    } catch (e) {
      console.warn('[useAuth] session restore failed:', e.message);
    }

    // Session is dead — clear everything
    await supabase.auth.signOut().catch(() => {});
    await AsyncStorage.removeItem(authKey);
    useAuthStore.setState({ auth: null, isReady: true });
  }, []);

  const signIn = useCallback(() => {
    open({ mode: 'signin' });
  }, [open]);

  const signUp = useCallback(() => {
    open({ mode: 'signup' });
  }, [open]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAuth(null);
    close();
  }, [setAuth, close]);

  return {
    isReady,
    isAuthenticated: isReady ? !!auth : null,
    signIn,
    signOut,
    signUp,
    auth,
    setAuth,
    initiate,
  };
};

export const useRequireAuth = (options) => {
  const { isAuthenticated, isReady } = useAuth();
  const { open } = useAuthModal();

  useEffect(() => {
    if (!isAuthenticated && isReady) {
      open({ mode: options?.mode });
    }
  }, [isAuthenticated, open, options?.mode, isReady]);
};

export default useAuth;
