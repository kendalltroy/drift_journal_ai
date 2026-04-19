import { useAuth, useRequireAuth } from "@/utils/auth/useAuth";
import { AuthModal } from "@/utils/auth/useAuthModal";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotificationManager from "@/utils/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ReminderOnboardingModal, { ONBOARDING_SHOWN_KEY } from "@/components/ReminderOnboardingModal";
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGate() {
  useRequireAuth({ mode: "signin" });
  return null;
}

export default function RootLayout() {
  const { initiate, isReady, auth } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    initiate();
    NotificationManager.requestPermission();
  }, [initiate]);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  useEffect(() => {
    if (!isReady || !auth) return;
    AsyncStorage.getItem(ONBOARDING_SHOWN_KEY).then((val) => {
      if (val === null) setShowOnboarding(true);
    });
  }, [isReady, auth]);

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            animationDuration: 800,
          }}
          initialRouteName="index"
        >
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
              animation: "fade",
            }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              animation: "fade",
            }}
          />
          <Stack.Screen
            name="entry/new"
            options={{
              headerShown: false,
              animation: "fade",
              animationDuration: 800,
            }}
          />
        </Stack>
        <AuthGate />
        <AuthModal />
        <ReminderOnboardingModal
          visible={showOnboarding}
          onDismiss={() => setShowOnboarding(false)}
        />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
