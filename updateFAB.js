const fs = require('fs');
let text = fs.readFileSync('src/components/finance/LedgerScreenTemplate.tsx', 'utf-8');

// Remove the inline add button from renderHeader
const oldAddButton = `
      <TouchableOpacity style={[styles.addButton, { backgroundColor: colorTheme }]} onPress={onActionPress}>
        <Text style={styles.addButtonText}>{actionButtonText}</Text>
      </TouchableOpacity>`;

text = text.replace(oldAddButton, '');

// Add the FAB just before the end of the main container return
const oldEnd = `      {renderModals(() => {
        setRefreshing(true);
        fetchData();
      })}
    </View>
  );
}`;

const newEnd = `      {renderModals(() => {
        setRefreshing(true);
        fetchData();
      })}

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colorTheme }]} 
        onPress={onActionPress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.fabText}>{actionButtonText.replace('+ ', '')}</Text>
      </TouchableOpacity>
    </View>
  );
}`;

text = text.replace(oldEnd, newEnd);

// Add FAB styles
const oldStylesEnd = `  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 40, fontSize: 16 }
});`;

const newStylesEnd = `  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 40, fontSize: 16 },
  fab: {
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
  }
});`;

text = text.replace(oldStylesEnd, newStylesEnd);

fs.writeFileSync('src/components/finance/LedgerScreenTemplate.tsx', text, 'utf-8');
console.log("FAB added");
