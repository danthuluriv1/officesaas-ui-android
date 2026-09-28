const fs = require('fs');
let text = fs.readFileSync('src/app/(tabs)/modules/_layout.tsx', 'utf-8');

if (!text.includes('NotificationBell')) {
  text = text.replace(
    "import { Stack, router } from 'expo-router';",
    "import { Stack, router } from 'expo-router';\nimport { NotificationBell } from '../../../../components/NotificationBell';"
  );
}

text = text.replace(
  "<Stack.Screen name=\"index\" options={{ title: 'Modules' }} />",
  "<Stack.Screen name=\"index\" options={{ title: 'Modules', headerRight: () => <NotificationBell /> }} />"
);

fs.writeFileSync('src/app/(tabs)/modules/_layout.tsx', text, 'utf-8');
console.log("NotificationBell added to Modules index");
