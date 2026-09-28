const fs = require('fs');
let text = fs.readFileSync('src/hooks/usePushNotifications.ts', 'utf-8');

if (!text.includes('Toast.show')) {
  text = "import Toast from 'react-native-toast-message';\n" + text;
}

text = text.replace(
  `    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    await axiosClient.put('/Users/push-token', { token: tokenData.data });
    console.log('[PushNotifications] Token registered:', tokenData.data);
  } catch (e) {
    console.warn('[PushNotifications] Failed to register token:', e);
  }`,
  `    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[PushNotifications] Fetched token:', tokenData.data);
    await axiosClient.put('/Users/push-token', { token: tokenData.data });
    console.log('[PushNotifications] Token registered with backend:', tokenData.data);
    Toast.show({ type: 'success', text1: 'Push Notifications Enabled', text2: 'Token synced with server.' });
  } catch (e: any) {
    console.warn('[PushNotifications] Failed to register token:', e);
    Toast.show({ type: 'error', text1: 'Push Token Error', text2: e?.message || 'Unknown error occurred.' });
  }`
);

// Show toast if skipped in Expo Go
text = text.replace(
  `    if (isExpoGo) {
      console.log('[PushNotifications] Skipping in Expo Go — use a dev build for push support.');
      return;
    }`,
  `    if (isExpoGo) {
      console.log('[PushNotifications] Skipping in Expo Go — use a dev build for push support.');
      Toast.show({ type: 'info', text1: 'Push Notifications Skipped', text2: 'Not supported in Expo Go.' });
      return;
    }`
);

// Show toast if permission denied
text = text.replace(
  `  if (finalStatus !== 'granted') {
    console.log('[PushNotifications] Permission denied.');
    return;
  }`,
  `  if (finalStatus !== 'granted') {
    console.log('[PushNotifications] Permission denied.');
    Toast.show({ type: 'error', text1: 'Push Notifications', text2: 'Permission was denied.' });
    return;
  }`
);

fs.writeFileSync('src/hooks/usePushNotifications.ts', text, 'utf-8');
console.log("Hook updated with Toasts");
