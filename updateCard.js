const fs = require('fs');
let text = fs.readFileSync('src/components/finance/LedgerScreenTemplate.tsx', 'utf-8');

const oldRender = `<View style={styles.detailCol}>
            <Text style={styles.label}>Type</Text>
            <Text style={[styles.amount, styles.debit]}>{item.expenseCategory || defaultCategory}</Text>
          </View>`;

const newRender = `<View style={styles.detailCol}>
            <Text style={styles.label}>{dataSource === 'payments' ? 'Paid By' : 'Category'}</Text>
            <Text style={[styles.amount, styles.debit]}>{dataSource === 'payments' ? (item.paidTo || '-') : (item.expenseCategory || defaultCategory)}</Text>
          </View>`;

text = text.replace(oldRender, newRender);

fs.writeFileSync('src/components/finance/LedgerScreenTemplate.tsx', text, 'utf-8');
console.log("Card updated");
