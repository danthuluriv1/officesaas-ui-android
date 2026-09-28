const fs = require('fs');
let text = fs.readFileSync('src/app/(tabs)/modules/index.tsx', 'utf-8');

text = text.replace(
  '<Text style={styles.header}>All Modules</Text>',
  ''
);

fs.writeFileSync('src/app/(tabs)/modules/index.tsx', text, 'utf-8');
console.log("Header removed");
