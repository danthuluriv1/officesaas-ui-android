import { Stack } from 'expo-router';

export default function DirectoryLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Staff Directory', headerShown: true }} />
      <Stack.Screen name="[id]" options={{ title: 'Employee Profile' }} />
    </Stack>
  );
}
