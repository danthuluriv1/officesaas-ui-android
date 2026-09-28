const fs = require('fs');
let text = fs.readFileSync('src/app/(tabs)/modules/finance/inflows.tsx', 'utf-8');

text = text.replace(
  'typeFilter="Credit"',
  'typeFilter="Credit"\n        dataSource="payments"'
);

fs.writeFileSync('src/app/(tabs)/modules/finance/inflows.tsx', text, 'utf-8');
console.log("Inflows updated");
