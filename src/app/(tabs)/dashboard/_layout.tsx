
import { Stack } from 'expo-router';
import { NotificationBell } from '../../../components/NotificationBell';

export default function DashboardLayout() {
  return <Stack screenOptions={{ headerRight: () => <NotificationBell /> }}><Stack.Screen name="index" options={{ title: 'Dashboard' }} /></Stack>;
}
