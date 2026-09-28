const fs = require('fs');
let text = fs.readFileSync('src/app/(tabs)/modules/finance/ledger.tsx', 'utf-8');

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
// Wait, my previous replacement might not have matched exactly!
// Let's just find setFilterModalVisible and remove that block.
text = text.replace(
  /<TouchableOpacity onPress=\{\(\) => setFilterModalVisible\(true\)\} style=\{\{ padding: 8 \}\}>\s*<Ionicons name="filter" size=\{24\} color=\{Theme\.colors\.primary\} \/>\s*<\/TouchableOpacity>/m,
  "null"
);

fs.writeFileSync('src/app/(tabs)/modules/finance/ledger.tsx', text, 'utf-8');
console.log("Filter Modal ref removed");
