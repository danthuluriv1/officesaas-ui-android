const fs = require('fs');
let text = fs.readFileSync('src/app/(tabs)/modules/finance/ledger.tsx', 'utf-8');

text = text.replace(
  ") : (\n        \n      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>",
  ") : (\n        <>\n      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>"
);

text = text.replace(
  "        ListEmptyComponent={<Text style={styles.emptyText}>No financial records match your filters.</Text>}\n        />\n      )}",
  "        ListEmptyComponent={<Text style={styles.emptyText}>No financial records match your filters.</Text>}\n        />\n        </>\n      )}"
);

fs.writeFileSync('src/app/(tabs)/modules/finance/ledger.tsx', text, 'utf-8');
console.log("Syntax fixed");
