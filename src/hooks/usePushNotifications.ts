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

  if (!Device.isDevice) {
    console.log('[PushNotifications] Skipping — physical device required.');
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
    await axiosClient.put('/Users/push-token', { token: tokenData.data });
    console.log('[PushNotifications] Token registered:', tokenData.data);
  } catch (e) {
    console.warn('[PushNotifications] Failed to register token:', e);
  }
}
