import React, { useState } from 'react';
import { LedgerScreenTemplate } from '../../../../components/finance/LedgerScreenTemplate';
import { ExpenseModal } from '../../../../components/finance/ExpenseModal';

export default function ExpensesScreen() {
  const [addExpenseVisible, setAddExpenseVisible] = useState(false);

  return (
    <LedgerScreenTemplate
      title="All Expenses"
      typeFilter="Debit"
      colorTheme="#DC2626"
      defaultCategory="Uncategorized"
      emptyMessage="No expenses recorded recently."
      actionButtonText="+ Log New Expense"
      onActionPress={() => setAddExpenseVisible(true)}
      renderModals={(onSuccess) => (
        addExpenseVisible && (
          <ExpenseModal 
            visible={addExpenseVisible} 
            onClose={() => setAddExpenseVisible(false)} 
            onSuccess={onSuccess} 
          />
        )
      )}
    />
  );
}
