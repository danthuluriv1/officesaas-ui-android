import React, { useState } from 'react';
import { LedgerScreenTemplate } from '../../../../components/finance/LedgerScreenTemplate';
import { PaymentModal } from '../../../../components/finance/PaymentModal';

export default function InflowsScreen() {
  const [addPaymentVisible, setAddPaymentVisible] = useState(false);

  return (
    <LedgerScreenTemplate
      title="All Inflows"
      typeFilter="Credit"
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
  );
}
