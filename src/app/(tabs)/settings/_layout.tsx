
import { Stack } from 'expo-router';
import { NotificationBell } from '../../../components/NotificationBell';

export default function SettingsLayout() {
  return <Stack screenOptions={{ headerRight: () => <NotificationBell /> }}><Stack.Screen name="index" options={{ title: 'Settings' }} /></Stack>;
}
