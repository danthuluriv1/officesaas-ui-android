const fs = require('fs');
let text = fs.readFileSync('src/components/finance/LedgerScreenTemplate.tsx', 'utf-8');

// 1. Update filterData type and init state to include paidBy
text = text.replace(
  "const [filterData, setFilterData] = useState<{categories: string[], paidTo: string[]}>({ categories: [], paidTo: [] });",
  "const [filterData, setFilterData] = useState<{categories: string[], paidTo: string[], paidBy?: string[]}>({ categories: [], paidTo: [], paidBy: [] });"
);

// 2. Update the options for Paid By filter to use filterData.paidBy
// Options currently: options: [{ label: 'All', value: '' }, ...Array.from(new Set(ledger.map(item => item.paidTo).filter(Boolean))).map(p => ({ label: p, value: p }))]
text = text.replace(
  "options: [{ label: 'All', value: '' }, ...Array.from(new Set(ledger.map(item => item.paidTo).filter(Boolean))).map(p => ({ label: p, value: p }))]",
  "options: [{ label: 'All', value: '' }, ...(filterData.paidBy || []).map(p => ({ label: p, value: p }))]"
);

fs.writeFileSync('src/components/finance/LedgerScreenTemplate.tsx', text, 'utf-8');
console.log("Template updated");
