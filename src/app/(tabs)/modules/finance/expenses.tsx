import React, { useState } from 'react';
import { LedgerScreenTemplate } from '../../../../components/finance/LedgerScreenTemplate';
import { ExpenseModal } from '../../../../components/finance/ExpenseModal';
import { Stack as ExpoStack } from 'expo-router';

export default function ExpensesScreen() {
  const [addExpenseVisible, setAddExpenseVisible] = useState(false);

  return (
    <>
      <ExpoStack.Screen options={{ title: 'Expenses' }} />
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
    </>
  );
}
