import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { Theme } from '../../theme';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { FinanceService } from '../../api/financeService';
import { documentService } from '../../api/documentService';
import { DropdownPicker, DropdownOption } from '../ui/DropdownPicker';
import { DatePickerField } from '../ui/DatePickerField';
import { AppAlertStatic } from '../ui/AppAlert';
import { AttachmentField } from '../ui/AttachmentField';
import type { FileAttachment } from '../ui/SelectedFilesList';

const EXPENSE_CATEGORIES: DropdownOption<string>[] = [
  { label: 'Office Rent', value: 'OfficeRent' },
  { label: 'Utilities & Power', value: 'Utilities' },
  { label: 'SaaS Subscriptions', value: 'SoftwareSaaS' },
  { label: 'Marketing Expense', value: 'Marketing' },
  { label: 'Logistics & Supply', value: 'Logistics' },
];

const PAYMENT_MODES: DropdownOption<number>[] = [
  { label: 'UPI Transfer', value: 0 },
  { label: 'RTGS / NEFT Core', value: 1 },
  { label: 'NetBanking Portal', value: 2 },
  { label: 'Corporate Card', value: 3 },
  { label: 'Petty Cash Reserve', value: 4 },
  { label: 'Cheque', value: 5 },
];

interface ExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ visible, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [jePostingDate, setJePostingDate] = useState(new Date());
  const [jeAmount, setJeAmount] = useState('');
  const [jeCategory, setJeCategory] = useState('');
  const [jePaidTo, setJePaidTo] = useState('');
  const [jeMode, setJeMode] = useState<number>(0); 
  const [jeUpiRef, setJeUpiRef] = useState('');
  const [jeDesc, setJeDesc] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);

  const handleAddJournalEntry = async () => {
    if (!jeAmount || !jeCategory || !jePaidTo || !jeUpiRef || !jeDesc) {
      AppAlertStatic.alert('Error', 'Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        postingDate: jePostingDate.toISOString(),
        totalAmount: parseFloat(jeAmount),
        expenseCategory: jeCategory,
        description: jeDesc,
        mode: jeMode,
        referenceNumberOrUpi: jeUpiRef,
        paidTo: jePaidTo
      };
      const response = await FinanceService.createJournalEntry(payload);
      if (response.status >= 400) throw new Error('Failed to post entry');
      
      const responseData = response.data?.data || response.data;
      const entityId = responseData?.entityId;
      if (typeof entityId === 'string' || typeof entityId === 'object') { // string or guid representation
        await documentService.uploadMultipleDocuments(attachments, 7, entityId.toString(), 6);
      }
      
      setJeAmount(''); setJeCategory(''); setJePaidTo(''); setJeUpiRef(''); setJeDesc(''); setAttachments([]);
      onSuccess();
      onClose();
    } catch (error: any) {
      AppAlertStatic.alert('Error', error.message || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Post Journal Entry</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
          </View>
          
          <DatePickerField label="Posting Date" date={jePostingDate} onChange={setJePostingDate} />
          
          <Text style={styles.inputLabel}>Debit Amount (₹)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={jeAmount} onChangeText={setJeAmount} placeholder="0.00" />
          
          <DropdownPicker label="Category Head" options={EXPENSE_CATEGORIES} selectedValue={jeCategory} onSelect={(val) => setJeCategory(val as string)} placeholder="Select Account..." />
          
          <Text style={styles.inputLabel}>Paid To (Beneficiary)</Text>
          <TextInput style={styles.input} value={jePaidTo} onChangeText={setJePaidTo} placeholder="Entity Name" />

          <DropdownPicker label="Payment Instrument" options={PAYMENT_MODES} selectedValue={jeMode} onSelect={(val) => setJeMode(val as number)} />

          <Text style={styles.inputLabel}>UPI Id / Bank Ref</Text>
          <TextInput style={styles.input} value={jeUpiRef} onChangeText={setJeUpiRef} placeholder="UTR or Txn ID" />

          <Text style={styles.inputLabel}>Narration Statement</Text>
          <TextInput style={styles.input} value={jeDesc} onChangeText={setJeDesc} placeholder="Description..." multiline numberOfLines={2} />

          <AttachmentField label="Receipts / Proof" files={attachments} onChange={setAttachments} />

          <TouchableOpacity style={styles.submitBtn} onPress={handleAddJournalEntry} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Commit Voucher</Text>}
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
