import Toast from 'react-native-toast-message';
import { useEffect } from 'react';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import axiosClient from '../api/axiosClient';

export function usePushNotifications() {
  useEffect(() => {
    // Push notifications are not supported in Expo Go (SDK 53+).
    // They only work in a development build or production build.
    const isExpoGo = Constants.appOwnership === 'expo';
    if (isExpoGo) {
      console.log('[PushNotifications] Skipping in Expo Go — use a dev build for push support.');
      Toast.show({ type: 'info', text1: 'Push Notifications Skipped', text2: 'Not supported in Expo Go.' });
      return;
    }

    registerForPushNotifications();
  }, []);
}

async function registerForPushNotifications() {
  // Dynamically import so the module doesn't crash in Expo Go
  const Notifications = await import('expo-notifications');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (!Device.isDevice && Platform.OS === 'ios') {
    console.log('[PushNotifications] Skipping — physical device required for iOS.');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[PushNotifications] Permission denied.');
    Toast.show({ type: 'error', text1: 'Push Notifications', text2: 'Permission was denied.' });
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('[PushNotifications] Missing EAS Project ID in app.json. Push token might fail.');
    }
    
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[PushNotifications] Fetched token:', tokenData.data);
    await axiosClient.put('/Users/push-token', { token: tokenData.data });
    console.log('[PushNotifications] Token registered with backend:', tokenData.data);
    Toast.show({ type: 'success', text1: 'Push Notifications Enabled', text2: 'Token synced with server.' });
  } catch (e: any) {
    console.warn('[PushNotifications] Failed to register token:', e);
    Toast.show({ type: 'error', text1: 'Push Token Error', text2: e?.message || 'Unknown error occurred.' });
  }
}
