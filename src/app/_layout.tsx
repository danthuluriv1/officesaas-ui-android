import { useEffect, useState } from 'react';
import { Stack, router, SplashScreen } from 'expo-router';
import { getItem, setItem } from '../utils/storage';
import axiosClient from '../api/axiosClient';
import { View, ActivityIndicator } from 'react-native';
import { SettingsProvider } from '../context/SettingsContext';
import Toast from 'react-native-toast-message';

import { AppAlert, appAlertRef } from '../components/ui/AppAlert';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await getItem('saas_token');
        if (token) {
          router.replace('/(tabs)/dashboard');
        } else {
          // Access token is missing/expired, let's see if we can refresh it silently
          const refreshToken = await getItem('saas_refresh_token');
          if (refreshToken) {
            try {
              // Try silent refresh
              const response = await axiosClient.post('/Auth/refresh', { refreshToken });
              if (response.data.isSuccess) {
                const { token: newToken, refreshToken: newRefreshToken } = response.data.data;
                await setItem('saas_token', newToken);
                await setItem('saas_refresh_token', newRefreshToken);
                router.replace('/(tabs)/dashboard');
              }
            } catch (err) {
              console.log('[AuthCheck] Silent refresh failed:', err);
            }
          }
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    }

    checkAuth();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <Toast />
        <AppAlert ref={appAlertRef} />
      </SettingsProvider>
    </QueryClientProvider>
  );
}
