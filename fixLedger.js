const fs = require('fs');
let text = fs.readFileSync('src/components/finance/LedgerScreenTemplate.tsx', 'utf-8');

// 1. Fix import to include JournalEntryItem and JournalEntriesFilter
text = text.replace(
  "import type { LedgerEntry } from '../../types';",
  "import type { LedgerEntry, JournalEntryItem } from '../../types';\nimport { type JournalEntriesFilter } from '../../api/financeService';"
);

// 2. Replace the fetchData to call getJournalEntries with live filters
const oldFetch = `  const fetchData = async () => {
    try {
      const filters = await FinanceService.getLedgerFilters();
      setFilterData(filters);

      const data = await FinanceService.getLedger(1, 100);
      const isDebit = typeFilter === 'Debit';
      const filteredData = data.filter(item => 
        isDebit ? (item.type === 'Debit' || item.type === '0' || item.type === 0) 
                : (item.type === 'Credit' || item.type === '1' || item.type === 1)
      );
      setLedger(filteredData);`;

const newFetch = `  const fetchData = async () => {
    try {
      const filters = await FinanceService.getLedgerFilters();
      setFilterData(filters);

      const result = await FinanceService.getJournalEntries({
        from: startDate,
        to: endDate,
        category: selectedCategory || undefined,
        paidTo: selectedPaidTo || undefined,
        pageNumber: 1,
        pageSize: 200,
      });
      setLedger(result.items);`;

text = text.replace(oldFetch, newFetch);

// 3. Update ledger state to JournalEntryItem[]
text = text.replace(
  "const [ledger, setLedger] = useState<LedgerEntry[]>([]);",
  "const [ledger, setLedger] = useState<JournalEntryItem[]>([]);"
);

// 4. Remove the client-side filteredLedger block (now filtering is server-side)
const oldFilter = `  const filteredLedger = ledger.filter(item => {
    if (selectedCategory && (item.accountCategory || defaultCategory) !== selectedCategory) return false;
    if (selectedPaidTo && item.paidTo !== selectedPaidTo && !item.description?.includes(selectedPaidTo)) return false;
    if (startDate && new Date(item.postingDate) < new Date(startDate)) return false;
    if (endDate && new Date(item.postingDate) > new Date(\`\${endDate}T23:59:59\`)) return false;
    return true;
  });`;
text = text.replace(oldFilter, `  const filteredLedger = ledger;`);

// 5. Fix chart data to use JournalEntryItem fields
text = text.replace(
  'const cat = item.accountCategory || defaultCategory;',
  'const cat = item.expenseCategory || defaultCategory;'
);

// 6. Fix pie chart total to use totalAmount
text = text.replace(
  'const totalAmount = chartData.reduce((acc, curr) => acc + curr.population, 0);',
  'const totalAmount = ledger.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);'
);

// 7. Replace fetchData on filter changes — add useEffect for filter deps
const oldUseEffect = `  useEffect(() => {
    fetchData();
  }, []);`;
const newUseEffect = `  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedCategory, selectedPaidTo]);`;
text = text.replace(oldUseEffect, newUseEffect);

// 8. Rename "History" -> "Transactions"
text = text.replace(
  '<Text style={styles.sectionTitle}>History</Text>',
  '<Text style={styles.sectionTitle}>Transactions</Text>'
);

// 9. Fix renderItem to use JournalEntryItem fields
text = text.replace(
  "const renderItem = ({ item }: { item: LedgerEntry })",
  "const renderItem = ({ item }: { item: JournalEntryItem })"
);
text = text.replace(
  "{item.description || 'Entry'}",
  "{item.description || item.paidTo || 'Entry'}"
);
text = text.replace(
  "item.postingDate ? new Date(item.postingDate).toLocaleDateString() : ''",
  "item.postingDate ? new Date(item.postingDate).toLocaleDateString() : ''"
);

fs.writeFileSync('src/components/finance/LedgerScreenTemplate.tsx', text, 'utf-8');
console.log("LedgerScreenTemplate updated");
