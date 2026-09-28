const fs = require('fs');
let text = fs.readFileSync('src/components/finance/LedgerScreenTemplate.tsx', 'utf-8');

text = text.replace(
  /<View style=\{styles\.detailCol\}>\s*<Text style=\{styles\.label\}>Type<\/Text>\s*<Text style=\{\[styles\.amount, styles\.debit\]\}>\{item\.expenseCategory \|\| defaultCategory\}<\/Text>\s*<\/View>/g,
  `<View style={styles.detailCol}>
          <Text style={styles.label}>{dataSource === 'payments' ? 'Paid By' : 'Category'}</Text>
          <Text style={[styles.amount, styles.debit]}>{dataSource === 'payments' ? (item.paidTo || '-') : (item.expenseCategory || defaultCategory)}</Text>
        </View>`
);

fs.writeFileSync('src/components/finance/LedgerScreenTemplate.tsx', text, 'utf-8');
console.log("Card replaced via regex");
