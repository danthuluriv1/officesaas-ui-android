const fs = require('fs');
let text = fs.readFileSync('src/components/finance/LedgerScreenTemplate.tsx', 'utf-8');

text = text.replace(
  "  renderModals\n}: LedgerScreenTemplateProps) {",
  "  renderModals,\n  dataSource = 'journal-entries'\n}: LedgerScreenTemplateProps) {"
);

fs.writeFileSync('src/components/finance/LedgerScreenTemplate.tsx', text, 'utf-8');
console.log("Fixed dataSource");
