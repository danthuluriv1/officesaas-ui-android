const fs = require('fs');
const path = require('path');

const tabsDir = 'src/app/(tabs)';

// 1. Move dashboard
fs.mkdirSync(path.join(tabsDir, 'dashboard'), { recursive: true });
fs.renameSync(path.join(tabsDir, 'dashboard.tsx'), path.join(tabsDir, 'dashboard', 'index.tsx'));
fs.writeFileSync(path.join(tabsDir, 'dashboard', '_layout.tsx'), `
import { Stack } from 'expo-router';
import { NotificationBell } from '../../../../components/NotificationBell';

export default function DashboardLayout() {
  return <Stack screenOptions={{ headerRight: () => <NotificationBell /> }}><Stack.Screen name="index" options={{ title: 'Dashboard' }} /></Stack>;
}
`, 'utf-8');

// 2. Move settings
fs.mkdirSync(path.join(tabsDir, 'settings'), { recursive: true });
let settingsText = fs.readFileSync(path.join(tabsDir, 'settings.tsx'), 'utf-8');
// Remove heading from Settings screen
settingsText = settingsText.replace(/<AppText style=\{styles\.title\}>Settings<\/AppText>/g, '');
fs.writeFileSync(path.join(tabsDir, 'settings', 'index.tsx'), settingsText, 'utf-8');
fs.unlinkSync(path.join(tabsDir, 'settings.tsx'));

fs.writeFileSync(path.join(tabsDir, 'settings', '_layout.tsx'), `
import { Stack } from 'expo-router';
import { NotificationBell } from '../../../../components/NotificationBell';

export default function SettingsLayout() {
  return <Stack screenOptions={{ headerRight: () => <NotificationBell /> }}><Stack.Screen name="index" options={{ title: 'Settings' }} /></Stack>;
}
`, 'utf-8');

// 3. Update tabs layout
let tabsLayout = fs.readFileSync(path.join(tabsDir, '_layout.tsx'), 'utf-8');
tabsLayout = tabsLayout.replace(
  `        headerShown: true,
        headerRight: () => <NotificationBell />`,
  `        headerShown: false` // disable global tab headers
);
fs.writeFileSync(path.join(tabsDir, '_layout.tsx'), tabsLayout, 'utf-8');

console.log("Restructure completed!");
