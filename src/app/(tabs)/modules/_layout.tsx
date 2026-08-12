import { Stack, router } from 'expo-router';

export default function ModulesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Modules', headerShown: false }} />
      <Stack.Screen name="directory" options={{ headerShown: false }} />
      <Stack.Screen name="inventory" options={{ title: 'Inventory' }} />
      <Stack.Screen name="products" options={{ title: 'Products' }} />
      <Stack.Screen name="products/[id]" options={{ title: 'Product Details' }} />
      <Stack.Screen name="orders" options={{ title: 'Orders' }} />
      <Stack.Screen name="orders/[id]" options={{ title: 'Order Details' }} />
      <Stack.Screen name="finance" options={{ title: 'Finance' }} />
      <Stack.Screen name="clients" options={{ title: 'Clients' }} />
      <Stack.Screen name="clients/[id]" options={{ title: 'Client Details' }} />
      <Stack.Screen name="vendors" options={{ title: 'Vendors' }} />
      <Stack.Screen name="vendors/[id]" options={{ title: 'Vendor Details' }} />
      <Stack.Screen name="attendance" options={{ title: 'Attendance' }} />
      <Stack.Screen name="inbox" options={{ title: 'Inbox' }} />
      <Stack.Screen name="inbox/[type]" options={{ title: 'Messages' }} />
      <Stack.Screen name="inbox/message/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="workspace" options={{ title: 'Team Workspace' }} />
      <Stack.Screen name="workspace/new" options={{ title: 'New Task', presentation: 'modal' }} />
      <Stack.Screen name="workspace/task/[id]" options={{ title: 'Task Details' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications', presentation: 'modal' }} />
      <Stack.Screen name="transportation" options={{ title: 'Transportation' }} />
      <Stack.Screen name="drivers" options={{ title: 'Drivers' }} />
      <Stack.Screen name="documents" options={{ title: 'Documents' }} />
      <Stack.Screen name="my-office" options={{ title: 'My Office' }} />
    </Stack>
  );
}
