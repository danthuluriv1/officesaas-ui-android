const fs = require('fs');
let text = fs.readFileSync('src/components/finance/LedgerScreenTemplate.tsx', 'utf-8');

// 1. Remove the FAB
const oldFAB = `
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colorTheme }]} 
        onPress={onActionPress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.fabText}>{actionButtonText.replace('+ ', '')}</Text>
      </TouchableOpacity>`;
text = text.replace(oldFAB, '');

// 2. Replace the Transactions header
const oldHeader = `<Text style={styles.sectionTitle}>Transactions</Text>`;
const newHeader = `<View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitleRow}>Transactions</Text>
        <TouchableOpacity style={[styles.inlineAddBtn, { backgroundColor: colorTheme }]} onPress={onActionPress}>
          <Ionicons name="add" size={18} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.inlineAddBtnText}>{actionButtonText.replace('+ ', '')}</Text>
        </TouchableOpacity>
      </View>`;
text = text.replace(oldHeader, newHeader);

// 3. Update styles
// Remove fab styles and add new ones
text = text.replace(
  `  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6
  },
  fabText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700'
  }`,
  `  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitleRow: { fontSize: 18, fontWeight: '700', color: '#111827' },
  inlineAddBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16 },
  inlineAddBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' }`
);

fs.writeFileSync('src/components/finance/LedgerScreenTemplate.tsx', text, 'utf-8');
console.log("Updated button placement");
