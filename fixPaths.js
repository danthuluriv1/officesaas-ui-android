const fs = require('fs');

function fix(file) {
  let text = fs.readFileSync(file, 'utf-8');
  text = text.replace(
    "import { NotificationBell } from '../../../../components/NotificationBell';",
    "import { NotificationBell } from '../../../components/NotificationBell';"
  );
  fs.writeFileSync(file, text, 'utf-8');
}

fix('src/app/(tabs)/dashboard/_layout.tsx');
fix('src/app/(tabs)/settings/_layout.tsx');
console.log("Paths fixed!");
