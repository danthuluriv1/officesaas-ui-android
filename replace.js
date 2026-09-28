const fs = require('fs');

let text = fs.readFileSync('src/components/finance/LedgerScreenTemplate.tsx', 'utf-8');

const pattern = /<TouchableOpacity[\s\S]*?<Text style=\{\[styles\.sectionTitle, \{ marginBottom: 0 \}\]\}>Filters<\/Text>[\s\S]*?<Ionicons[\s\S]*?<\/TouchableOpacity>\s*\{isFiltersExpanded && \([\s\S]*?<View style=\{styles\.filtersContainer\}>[\s\S]*?<\/View>\s*\)\}/m;

const replacement = `      <CollapsibleFilters
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
            id: 'category',
            label: 'Category',
            type: 'dropdown',
            value: selectedCategory,
            onChange: setSelectedCategory,
            placeholder: 'Any Category',
            options: [{ label: 'All', value: '' }, ...filterData.categories.map(c => ({ label: c, value: c }))]
          },
          {
            id: 'paidTo',
            label: 'Paid To',
            type: 'dropdown',
            value: selectedPaidTo,
            onChange: setSelectedPaidTo,
            placeholder: 'Any Paid To',
            options: [{ label: 'All', value: '' }, ...filterData.paidTo.map(p => ({ label: p, value: p }))]
          }
        ]}
      />`;

if (pattern.test(text)) {
  text = text.replace(pattern, replacement);
  fs.writeFileSync('src/components/finance/LedgerScreenTemplate.tsx', text, 'utf-8');
  console.log("Replaced successfully!");
} else {
  console.log("Pattern not found!");
}
