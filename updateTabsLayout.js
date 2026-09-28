const fs = require('fs');
let text = fs.readFileSync('src/app/(tabs)/_layout.tsx', 'utf-8');

text = text.replace(
  `name="modules"
          options={{
            title: 'Modules',
            tabBarLabel: 'Modules',`,
  `name="modules"
          options={{
            headerShown: false,
            title: 'Modules',
            tabBarLabel: 'Modules',`
);

fs.writeFileSync('src/app/(tabs)/_layout.tsx', text, 'utf-8');
console.log("TabsLayout updated");
