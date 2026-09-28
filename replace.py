import re

with open("src/components/finance/LedgerScreenTemplate.tsx", "r", encoding="utf-8") as f:
    text = f.read()

pattern = re.compile(r"<TouchableOpacity.*?<Text style=\{.*?\}>Filters</Text>.*?<Ionicons.*?</TouchableOpacity>\s*\{isFiltersExpanded && \(\s*<View style=\{styles\.filtersContainer\}>.*?</View>\s*</View>\s*</View>\s*</View>\s*\)\}", re.DOTALL)

replacement = """      <CollapsibleFilters
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
      />"""

new_text, count = pattern.subn(replacement, text)
print(f"Replaced {count} times")

with open("src/components/finance/LedgerScreenTemplate.tsx", "w", encoding="utf-8") as f:
    f.write(new_text)
