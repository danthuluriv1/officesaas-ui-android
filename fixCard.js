const fs = require('fs');
let text = fs.readFileSync('src/components/finance/LedgerScreenTemplate.tsx', 'utf-8');

// Fix amount display in card - item.amount -> item.totalAmount
text = text.replace(/\(item\.amount \|\| 0\)\.toLocaleString\(\)/g, '(item.totalAmount || 0).toLocaleString()');

// Fix type display - JournalEntry doesn't have type, show expenseCategory instead
text = text.replace(
  `{item.type || 'Debit'}`,
  `{item.expenseCategory || defaultCategory}`
);

// Fix credit/debit style - journal entries are all debits on expenses screen
text = text.replace(
  "item.type === 'Credit' ? styles.credit : styles.debit",
  "styles.debit"
);

// Fix setSelectedTransaction type
text = text.replace(
  "const [selectedTransaction, setSelectedTransaction] = useState<LedgerEntry | null>(null);",
  "const [selectedTransaction, setSelectedTransaction] = useState<JournalEntryItem | null>(null);"
);

fs.writeFileSync('src/components/finance/LedgerScreenTemplate.tsx', text, 'utf-8');
console.log("Card render fixed");
