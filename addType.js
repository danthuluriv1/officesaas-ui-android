const fs = require('fs');
let text = fs.readFileSync('src/types/index.ts', 'utf-8');

const newType = `
export interface JournalEntryItem {
  id: string;
  entityId: string;
  referenceNumber: string;
  postingDate: string;
  totalAmount: number;
  expenseCategory: string;
  description: string;
  paidTo: string;
  mode: string;
  referenceNumberOrUpi?: string;
}
`;

// append after LedgerEntry block
text = text.replace('  transactionNumber?: string;\n}', '  transactionNumber?: string;\n}' + newType);
fs.writeFileSync('src/types/index.ts', text, 'utf-8');
console.log("Done");
