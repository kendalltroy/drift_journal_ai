import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuthStore } from './store';

const callbackUrl = '/api/auth/token';
const callbackQueryString = `callbackUrl=${encodeURIComponent(callbackUrl)}`;

const INJECT_READ_TOKEN = `
  (function() {
    try {
      var text = document.body.innerText;
      var data = JSON.parse(text);
      if (data.jwt && data.user) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'AUTH_SUCCESS', jwt: data.jwt, user: data.user }));
      } else {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'AUTH_ERROR', error: text }));
      }
    } catch(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'AUTH_ERROR', error: e.message }));
    }
  })();
  true;
`;

export const AuthWebView = ({ mode, proxyURL, baseURL }) => {
  const [currentURI, setURI] = useState(`${baseURL}/account/${mode}?${callbackQueryString}`);
  const { auth, setAuth, isReady } = useAuthStore();
  const webViewRef = useRef(null);
  const isAuthenticated = isReady ? !!auth : null;
  const iframeRef = useRef(null);
  const pageLoadedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (isAuthenticated) router.back();
  }, [isAuthenticated]);

  useEffect(() => {
    console.log('[AuthWebView] reset effect fired. mode:', mode, 'isAuthenticated:', isAuthenticated);
    if (isAuthenticated) return;
    setURI(`${baseURL}/account/${mode}?${callbackQueryString}`);
  }, [mode, baseURL, isAuthenticated]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.addEventListener) return;
    const handleMessage = (event) => {
      if (event.origin !== process.env.EXPO_PUBLIC_PROXY_BASE_URL) return;
      if (event.data.type === 'AUTH_SUCCESS') {
        setAuth({ jwt: event.data.jwt, user: event.data.user });
      } else if (event.data.type === 'AUTH_ERROR') {
        console.error('Auth error:', event.data.error);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setAuth]);

  if (Platform.OS === 'web') {
    return (
      <iframe
        ref={iframeRef}
        title="Authentication"
        src={`${proxyURL}/account/${mode}?callbackUrl=/api/auth/expo-web-success`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        onError={() => console.error('Failed to load auth iframe')}
      />
    );
  }

  return (
    <WebView
      ref={webViewRef}
      sharedCookiesEnabled
      injectedJavaScript={`
        (function() {
          function disableAutofill() {
            document.querySelectorAll('input').forEach(function(el) {
              el.setAttribute('autocomplete', 'off');
              el.setAttribute('autocorrect', 'off');
              el.setAttribute('autocapitalize', 'off');
            });
          }
          disableAutofill();
          var observer = new MutationObserver(disableAutofill);
          observer.observe(document.body, { childList: true, subtree: true });
        })();
        true;
      `}
      source={{ uri: currentURI }}
      headers={{
        'x-createxyz-project-group-id': process.env.EXPO_PUBLIC_PROJECT_GROUP_ID,
        host: process.env.EXPO_PUBLIC_HOST,
        'x-forwarded-host': process.env.EXPO_PUBLIC_HOST,
        'x-createxyz-host': process.env.EXPO_PUBLIC_HOST,
      }}
      onMessage={(event) => {
        try {
          const parsed = JSON.parse(event.nativeEvent.data);
          if (parsed.type === 'AUTH_SUCCESS' && parsed.jwt && parsed.user) {
            setAuth({ jwt: parsed.jwt, user: parsed.user });
          } else if (parsed.type === 'AUTH_ERROR') {
            console.error('Auth error from WebView:', parsed.error);
          }
        } catch (e) {
          console.error('Failed to parse auth message:', e);
        }
      }}
      onLoad={() => { pageLoadedRef.current = true; }}
      onNavigationStateChange={(navState) => {
        if (navState.url.includes('/api/auth/token') && !navState.loading) {
          webViewRef.current?.injectJavaScript(INJECT_READ_TOKEN);
        }
      }}
      onShouldStartLoadWithRequest={(request) => {
        if (request.url === currentURI) {
          if (pageLoadedRef.current) return false;
          return true;
        }
        if (request.url.includes('/api/auth/token')) return true;
        if (request.url.includes('/account/')) return true;

        const hasParams = request.url.includes('?');
        const separator = hasParams ? '&' : '?';
        const newURL = proxyURL ? request.url.replaceAll(proxyURL, baseURL) : request.url;
        setURI(`${newURL}${separator}${callbackQueryString}`);
        return false;
      }}
      style={{ flex: 1 }}
    />
  );
};
