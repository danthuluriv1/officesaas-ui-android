import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { Theme } from '../../theme';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { FinanceService } from '../../api/financeService';
import { OrderService } from '../../api/orderService';
import { documentService } from '../../api/documentService';
import { DropdownPicker, DropdownOption } from '../ui/DropdownPicker';
import { DatePickerField } from '../ui/DatePickerField';
import type { Order, Party } from '../../types';
import { AppAlertStatic } from '../ui/AppAlert';
import { AttachmentField } from '../ui/AttachmentField';
import type { FileAttachment } from '../ui/SelectedFilesList';

const PAYMENT_MODES: DropdownOption<number>[] = [
  { label: 'UPI Transfer', value: 0 },
  { label: 'RTGS / NEFT Core', value: 1 },
  { label: 'NetBanking Portal', value: 2 },
  { label: 'Corporate Card', value: 3 },
  { label: 'Petty Cash Reserve', value: 4 },
  { label: 'Cheque', value: 5 },
];

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ visible, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  
  const [clients, setClients] = useState<Party[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [payClientId, setPayClientId] = useState('');
  const [payOrderId, setPayOrderId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date());
  const [payMode, setPayMode] = useState<number>(2); 
  const [payRef, setPayRef] = useState('');
  const [payRemarks, setPayRemarks] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);

  useEffect(() => {
    if (visible) {
      const fetchData = async () => {
        setLoadingDropdowns(true);
        try {
          const [ords, clis] = await Promise.all([
            OrderService.getOrders(1, 1000),
            OrderService.getParties('Client')
          ]);
          setOrders(ords);
          setClients(clis);
        } catch(e) {
          console.warn(e);
        } finally {
          setLoadingDropdowns(false);
        }
      };
      fetchData();
    }
  }, [visible]);

  const handleAddPayment = async () => {
    if (!payAmount || !payRef) {
      AppAlertStatic.alert('Error', 'Please fill Amount and Transaction Ref');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        transactionReference: payRef,
        associatedInvoiceEntityId: payOrderId ? payOrderId : null,
        paymentType: 'ReceivedFromClient',
        amount: parseFloat(payAmount),
        paymentDate: payDate.toISOString(),
        mode: payMode,
        remarks: payRemarks
      };
      const response = await FinanceService.createPayment(payload);
      if (response.status >= 400) throw new Error('Failed to post payment');
      
      const responseData = response.data?.data || response.data;
      const entityId = responseData?.entityId;
      if (typeof entityId === 'string' || typeof entityId === 'object') {
        await documentService.uploadMultipleDocuments(attachments, 7, entityId.toString(), 5);
      }
      
      setPayAmount(''); setPayRef(''); setPayRemarks(''); setPayOrderId(''); setPayClientId(''); setAttachments([]);
      onSuccess();
      onClose();
    } catch (error: any) {
      AppAlertStatic.alert('Error', error.message || 'Failed to add payment');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = payClientId 
    ? orders.filter(o => o.associatedPartyEntityId === payClientId)
    : orders;
    
  const clientOptions: DropdownOption[] = [
    { label: 'All Clients / Walk-in', value: '' },
    ...clients.map(c => ({ label: c.companyName, value: c.entityId }))
  ];

  const orderOptions: DropdownOption[] = [
    { label: 'No Order / Walk-in', value: '' },
    ...filteredOrders.map(o => ({ label: `${o.orderNumber} (₹${o.totalGrandAmount})`, value: o.entityId }))
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment Received</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
          </View>
          
          {loadingDropdowns ? (
             <ActivityIndicator color="#2563EB" style={{ marginBottom: 16 }} />
          ) : (
            <>
              <DropdownPicker label="Select Client (Optional)" options={clientOptions} selectedValue={payClientId} onSelect={(val) => { setPayClientId(val as string); setPayOrderId(''); }} />
              
              <DropdownPicker label="Link Order (Optional)" options={orderOptions} selectedValue={payOrderId} onSelect={(val) => {
                  setPayOrderId(val as string);
                  const o = filteredOrders.find(x => x.entityId === val);
                  if (o) setPayAmount(o.totalGrandAmount.toString());
                }} />
            </>
          )}

          <Text style={styles.inputLabel}>Amount (₹)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={payAmount} onChangeText={setPayAmount} placeholder="0.00" />
          
          <DatePickerField label="Payment Date" date={payDate} onChange={setPayDate} />

          <DropdownPicker label="Payment Mode" options={PAYMENT_MODES} selectedValue={payMode} onSelect={(val) => setPayMode(val as number)} />

          <Text style={styles.inputLabel}>Transaction Ref</Text>
          <TextInput style={styles.input} value={payRef} onChangeText={setPayRef} placeholder="Txn ID or Cheque No..." />

          <Text style={styles.inputLabel}>Remarks (Optional)</Text>
          <TextInput style={styles.input} value={payRemarks} onChangeText={setPayRemarks} placeholder="Notes..." multiline numberOfLines={2} />

          <AttachmentField label="Payment Proof / Documents" files={attachments} onChange={setAttachments} />

          <TouchableOpacity style={styles.submitBtn} onPress={handleAddPayment} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Post Payment</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  closeText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
