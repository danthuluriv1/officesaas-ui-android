const fs = require('fs');
let text = fs.readFileSync('src/app/(tabs)/modules/_layout.tsx', 'utf-8');

text = text.replace(
  `<Stack.Screen name="index" options={{ title: 'Modules', headerShown: false }} />`,
  `<Stack.Screen name="index" options={{ title: 'Modules' }} />`
);

fs.writeFileSync('src/app/(tabs)/modules/_layout.tsx', text, 'utf-8');
console.log("ModulesLayout updated");
