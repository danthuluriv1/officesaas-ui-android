const fs = require('fs');
let text = fs.readFileSync('src/app/(tabs)/modules/_layout.tsx', 'utf-8');

text = text.replace(
  "import { NotificationBell } from '../../../../components/NotificationBell';",
  "import { NotificationBell } from '../../../components/NotificationBell';"
);

fs.writeFileSync('src/app/(tabs)/modules/_layout.tsx', text, 'utf-8');
console.log("Path fixed");
