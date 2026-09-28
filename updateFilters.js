const fs = require('fs');
let text = fs.readFileSync('src/components/finance/LedgerScreenTemplate.tsx', 'utf-8');

const oldFilters = `filters={[
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
        ]}`;

const newFilters = `filters={[
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
          ...(dataSource === 'payments' ? [
            {
              id: 'paidBy',
              label: 'Paid By',
              type: 'dropdown' as const,
              value: selectedPaidTo,
              onChange: setSelectedPaidTo, // We reuse selectedPaidTo state for Paid By
              placeholder: 'Any Payer',
              // We could fetch actual payers, but for now we fallback to the paidTo list which might be empty or similar, ideally we should just use text input if it was supported, or just empty options
              // Actually, since we don't have distinct PaidBy from backend yet, let's just make it a dropdown with no options other than All for now, or maybe the user just wants the label changed.
              // Wait, we can extract unique 'paidTo' (mapped from paidBy) from the fetched ledger data itself as a fallback!
              options: [{ label: 'All', value: '' }, ...Array.from(new Set(ledger.map(item => item.paidTo).filter(Boolean))).map(p => ({ label: p, value: p }))]
            }
          ] : [
            {
              id: 'category',
              label: 'Category',
              type: 'dropdown' as const,
              value: selectedCategory,
              onChange: setSelectedCategory,
              placeholder: 'Any Category',
              options: [{ label: 'All', value: '' }, ...filterData.categories.map(c => ({ label: c, value: c }))]
            },
            {
              id: 'paidTo',
              label: 'Paid To',
              type: 'dropdown' as const,
              value: selectedPaidTo,
              onChange: setSelectedPaidTo,
              placeholder: 'Any Paid To',
              options: [{ label: 'All', value: '' }, ...filterData.paidTo.map(p => ({ label: p, value: p }))]
            }
          ])
        ]}`;

text = text.replace(oldFilters, newFilters);
fs.writeFileSync('src/components/finance/LedgerScreenTemplate.tsx', text, 'utf-8');
console.log("Filters updated");
