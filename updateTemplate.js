const fs = require('fs');
let text = fs.readFileSync('src/components/finance/LedgerScreenTemplate.tsx', 'utf-8');

// 1. Add dataSource to props
text = text.replace(
  "  renderModals: (onSuccess: () => void) => React.ReactNode;\n}",
  "  renderModals: (onSuccess: () => void) => React.ReactNode;\n  dataSource?: 'journal-entries' | 'payments';\n}"
);

// 2. Add dataSource to component arguments
text = text.replace(
  "  renderModals\n}: LedgerScreenTemplateProps) => {",
  "  renderModals,\n  dataSource = 'journal-entries'\n}: LedgerScreenTemplateProps) => {"
);

// 3. Update fetchData
const oldFetch = `      const result = await FinanceService.getJournalEntries({
        from: startDate,
        to: endDate,
        category: selectedCategory || undefined,
        paidTo: selectedPaidTo || undefined,
        pageNumber: 1,
        pageSize: 200,
      });
      setLedger(result.items);`;

const newFetch = `      if (dataSource === 'payments') {
        const result = await FinanceService.getPayments({
          from: startDate,
          to: endDate,
          paymentType: typeFilter === 'Credit' ? 'ReceivedFromClient' : 'MadeToVendor',
          paidBy: selectedPaidTo || undefined,
          pageNumber: 1,
          pageSize: 200,
        });
        
        // Map to common format
        const mapped = result.items.map((p: any) => ({
          ...p,
          totalAmount: p.amount,
          expenseCategory: 'Revenue',
          postingDate: p.paymentDate,
          paidTo: p.paidBy || '',
          description: p.remarks || 'Payment'
        }));
        setLedger(mapped);
      } else {
        const result = await FinanceService.getJournalEntries({
          from: startDate,
          to: endDate,
          category: selectedCategory || undefined,
          paidTo: selectedPaidTo || undefined,
          pageNumber: 1,
          pageSize: 200,
        });
        setLedger(result.items);
      }`;

text = text.replace(oldFetch, newFetch);

fs.writeFileSync('src/components/finance/LedgerScreenTemplate.tsx', text, 'utf-8');
console.log("Template updated");
