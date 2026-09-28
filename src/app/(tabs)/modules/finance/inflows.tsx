import React, { useState } from 'react';
import { LedgerScreenTemplate } from '../../../../components/finance/LedgerScreenTemplate';
import { PaymentModal } from '../../../../components/finance/PaymentModal';
import { Stack as ExpoStack } from 'expo-router';

export default function InflowsScreen() {
  const [addPaymentVisible, setAddPaymentVisible] = useState(false);

  return (
    <>
      <ExpoStack.Screen options={{ title: 'Payments' }} />
      <LedgerScreenTemplate
        title="All Inflows"
        typeFilter="Credit"
        dataSource="payments"
        colorTheme="#10B981"
        defaultCategory="Revenue"
        emptyMessage="No inflows recorded recently."
        actionButtonText="+ Receive Payment"
        onActionPress={() => setAddPaymentVisible(true)}
        renderModals={(onSuccess) => (
          addPaymentVisible && (
            <PaymentModal 
              visible={addPaymentVisible} 
              onClose={() => setAddPaymentVisible(false)} 
              onSuccess={onSuccess} 
            />
          )
        )}
      />
    </>
  );
}
