const fs = require('fs');
let text = fs.readFileSync('src/app/(tabs)/modules/finance/ledger.tsx', 'utf-8');

// Add CollapsibleFilters import
if (!text.includes('CollapsibleFilters')) {
  text = text.replace(
    "import { DropdownPicker } from '../../../../components/ui/DropdownPicker';",
    "import { DropdownPicker } from '../../../../components/ui/DropdownPicker';\nimport { CollapsibleFilters, FilterConfig } from '../../../../components/ui/CollapsibleFilters';"
  );
}

// State changes
text = text.replace(
  `  // Filter State
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    transactionType: '',
  });
  
  // Date Picker States
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });`,
  `  // Filter State
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<string>('');`
);

// We need to change fetchLedger signature or usage to depend on these state variables directly using useEffect.
// Actually, let's keep fetchLedger without args and use the state variables.
text = text.replace(
  `  const fetchLedger = async (activeFilters: any = appliedFilters) => {
    try {
      const data = await FinanceService.getLedger(1, 100, activeFilters);`,
  `  const fetchLedger = async () => {
    try {
      const activeFilters = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        transactionType: transactionType || undefined
      };
      const data = await FinanceService.getLedger(1, 100, activeFilters);`
);

// We need to trigger fetchLedger on filter changes
text = text.replace(
  `  useEffect(() => {
    fetchLedger();
  }, []);`,
  `  useEffect(() => {
    fetchLedger();
  }, [startDate, endDate, transactionType]);`
);

// Remove the filter button from header right
text = text.replace(
  `          options={{ 
          title: 'Ledger',
          headerRight: () => (
            <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={{ padding: 8 }}>
              <Ionicons name="filter" size={24} color={Theme.colors.primary} />
            </TouchableOpacity>
          )
        }}`,
  `          options={{ 
          title: 'Ledger'
        }}`
);

// We need to inject CollapsibleFilters before the FlatList
const listStart = `<FlatList`;
const collapsible = `
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <CollapsibleFilters
          title="Filters"
          initialExpanded={false}
          filters={[
            {
              id: 'startDate',
              label: 'From:',
              type: 'date',
              value: startDate,
              onChange: setStartDate
            },
            {
              id: 'endDate',
              label: 'To:',
              type: 'date',
              value: endDate,
              onChange: setEndDate
            },
            {
              id: 'type',
              label: 'Transaction Type',
              type: 'dropdown',
              value: transactionType,
              onChange: setTransactionType,
              placeholder: 'All Types',
              options: [
                { label: 'All Types', value: '' },
                { label: 'Debit (Outflow)', value: 'Debit' },
                { label: 'Credit (Inflow)', value: 'Credit' }
              ]
            }
          ]}
        />
      </View>
      <FlatList`;
text = text.replace(listStart, collapsible);

// Now we remove applyFilters, clearFilters, handleDateChange, and the entire Modal!
// A simple way is to use regex or string slices.
// Let's remove from `const applyFilters = () => {` down to `  const renderItem = ({ item }: { item: LedgerEntry }) => (`
text = text.replace(
  /const applyFilters = \(\) => \{[\s\S]*?const renderItem = \(\{ item \}: \{ item: LedgerEntry \}\) => \(/m,
  "const renderItem = ({ item }: { item: LedgerEntry }) => ("
);

// Now remove the Modal from JSX
text = text.replace(
  /\{\/\* Filter Modal \*\/\}([\s\S]*?)<\/Modal>/m,
  ""
);

// Remove unused DateTimePicker import
text = text.replace(
  "import DateTimePicker from '@react-native-community/datetimepicker';",
  ""
);

fs.writeFileSync('src/app/(tabs)/modules/finance/ledger.tsx', text, 'utf-8');
console.log("Ledger filters modernized");
