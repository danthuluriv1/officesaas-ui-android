import { useEffect, useState } from 'react';
import { Stack, router, SplashScreen } from 'expo-router';
import { getItem, setItem } from '../utils/storage';
import axiosClient from '../api/axiosClient';
import { View, ActivityIndicator } from 'react-native';
import { SettingsProvider } from '../context/SettingsContext';
import Toast from 'react-native-toast-message';

import { AppAlert, appAlertRef, AppAlertStatic } from '../components/ui/AppAlert';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

import { useShareIntent } from 'expo-share-intent';
import { ExpenseModal } from '../components/finance/ExpenseModal';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function ShareIntentListener() {
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntent();
  const [modalVisible, setModalVisible] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [sharedFileObj, setSharedFileObj] = useState<any>(null);

  useEffect(() => {
    if (hasShareIntent && shareIntent && shareIntent.files && shareIntent.files.length > 0) {
      handleSharedFile(shareIntent.files[0]);
    }
  }, [hasShareIntent, shareIntent]);

  const handleSharedFile = async (file: any) => {
    setSharedFileObj({
      uri: file.path,
      name: file.fileName || 'receipt.jpg',
      type: file.mimeType?.includes('pdf') ? 'document' : 'image',
      mimeType: file.mimeType || 'image/jpeg'
    });
    
    AppAlertStatic.alert("Processing Receipt", "Extracting details with AI...", []);
    try {
        const formData = new FormData();
        formData.append('file', {
           uri: file.path,
           name: file.fileName || 'receipt.jpg',
           type: file.mimeType || 'image/jpeg'
        } as any);

        const res = await axiosClient.post('/Financials/extract-receipt', formData, {
           headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (res.data.isSuccess) {
           AppAlertStatic.close();
           setExtractedData(res.data.data);
           setModalVisible(true);
        } else {
           AppAlertStatic.alert("Extraction Failed", "Could not parse receipt.");
        }
    } catch(e) {
        console.error(e);
        AppAlertStatic.alert("Extraction Failed", "Could not connect to AI service.");
    } finally {
        resetShareIntent();
    }
  };

  return (
    <>
       {modalVisible && (
          <ExpenseModal 
             visible={modalVisible} 
             onClose={() => { setModalVisible(false); setSharedFileObj(null); setExtractedData(null); }} 
             onSuccess={() => { setModalVisible(false); setSharedFileObj(null); setExtractedData(null); }}
             initialData={extractedData} 
             initialFile={sharedFileObj}
          />
       )}
    </>
  )
}

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
        <ShareIntentListener />
        <Toast />
        <AppAlert ref={appAlertRef} />
      </SettingsProvider>
    </QueryClientProvider>
  );
}
