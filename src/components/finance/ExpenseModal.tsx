import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { Theme } from '../../theme';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { FinanceService } from '../../api/financeService';
import { OrderService } from '../../api/orderService';
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
  initialData?: {
    paidTo?: string;
    amount?: string | number;
    referenceNumber?: string;
    notes?: string;
  };
  initialFile?: FileAttachment;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ visible, onClose, onSuccess, initialData, initialFile }) => {
  const [submitting, setSubmitting] = useState(false);
  const [jePostingDate, setJePostingDate] = useState(new Date());
  const [jeAmount, setJeAmount] = useState('');
  const [jeCategory, setJeCategory] = useState('');
  const [jePaidTo, setJePaidTo] = useState('');
  const [jeMode, setJeMode] = useState<number>(0); 
  const [jeUpiRef, setJeUpiRef] = useState('');
  const [jeDesc, setJeDesc] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [isAdhocVendor, setIsAdhocVendor] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setIsAdhocVendor(false);
      OrderService.getParties('Vendor')
        .then(res => setVendors(res))
        .catch(console.warn);
        
      if (initialData) {
        if (initialData.amount) setJeAmount(initialData.amount.toString());
        if (initialData.paidTo) {
           setIsAdhocVendor(true); // default to adhoc for extracted names
           setJePaidTo(initialData.paidTo);
        }
        if (initialData.referenceNumber) setJeUpiRef(initialData.referenceNumber);
        if (initialData.notes) setJeDesc(initialData.notes);
      } else {
        setJeAmount('');
        setJePaidTo('');
        setJeUpiRef('');
        setJeDesc('');
        setJeCategory('');
      }
      
      if (initialFile) {
        setAttachments([initialFile]);
      } else if (!initialData) {
        setAttachments([]);
      }
    }
  }, [visible, initialData, initialFile]);

  const [isExtracting, setIsExtracting] = useState(false);

  const handleAttachmentsChange = async (newAttachments: FileAttachment[]) => {
    // Determine if a new file was added
    const addedFiles = newAttachments.filter(na => !attachments.some(a => a.uri === na.uri));
    setAttachments(newAttachments);

    if (addedFiles.length > 0) {
      const file = addedFiles[0];
      // Only extract if the file is an image or PDF and we haven't already filled the amount
      if (!jeAmount) {
        setIsExtracting(true);
        AppAlertStatic.alert("Processing Receipt", "Extracting details with AI...", []);
        try {
          const formData = new FormData();
          formData.append('file', {
            uri: file.uri,
            name: file.name || 'receipt.jpg',
            type: file.mimeType || 'image/jpeg'
          } as any);

          const { default: axiosClient } = await import('../../api/axiosClient');
          const res = await axiosClient.post('/Financials/extract-receipt', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          if (res.data.isSuccess) {
            const data = res.data.data;
            if (data.amount && !jeAmount) setJeAmount(data.amount.toString());
            if (data.paidTo && !jePaidTo) {
               setIsAdhocVendor(true);
               setJePaidTo(data.paidTo);
            }
            if (data.referenceNumber && !jeUpiRef) setJeUpiRef(data.referenceNumber);
            if (data.notes && !jeDesc) setJeDesc(data.notes);
            AppAlertStatic.alert("Extraction Complete", "Fields have been pre-filled.");
          } else {
            AppAlertStatic.close();
          }
        } catch (error) {
          console.warn("Extraction failed", error);
          AppAlertStatic.alert("Extraction Failed", "Could not connect to AI service.");
        } finally {
          setIsExtracting(false);
        }
      }
    }
  };

  const handleAddJournalEntry = async () => {
    if (!jeAmount || !jeCategory || !jePaidTo || !jeDesc) {
      AppAlertStatic.alert('Error', 'Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const matchedVendor = vendors.find(v => v.companyName === jePaidTo);
      const payload = {
        postingDate: jePostingDate.toISOString(),
        totalAmount: parseFloat(jeAmount),
        expenseCategory: jeCategory,
        description: jeDesc,
        mode: jeMode,
        referenceNumberOrUpi: jeUpiRef,
        paidTo: jePaidTo,
        associatedVendorEntityId: matchedVendor ? matchedVendor.entityId : null
      };
      const response = await FinanceService.createJournalEntry(payload);
      if (response.status >= 400) throw new Error('Failed to post entry');
      
      const responseData = response.data?.data || response.data;
      const entityId = responseData?.entityId;
      if (typeof entityId === 'string' || typeof entityId === 'object') { // string or guid representation
        await documentService.uploadMultipleDocuments(attachments, 7, entityId.toString(), 6);
      }
      
      setJeAmount(''); setJeCategory(''); setJePaidTo(''); setJeUpiRef(''); setJeDesc(''); setAttachments([]); setIsAdhocVendor(false);
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
          
          {!isAdhocVendor ? (
            <DropdownPicker 
              label="Paid To (Beneficiary)" 
              options={[
                ...vendors.map(v => ({ label: v.companyName, value: v.companyName })),
                { label: '+ Add Adhoc Payment', value: 'ADHOC' }
              ]} 
              selectedValue={jePaidTo} 
              onSelect={(val) => {
                if (val === 'ADHOC') {
                  setIsAdhocVendor(true);
                  setJePaidTo('');
                } else {
                  setJePaidTo(val as string);
                }
              }} 
              placeholder="Select Vendor..." 
            />
          ) : (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.inputLabel}>Paid To (Beneficiary)</Text>
                <TouchableOpacity onPress={() => { setIsAdhocVendor(false); setJePaidTo(''); }}>
                  <Text style={{ color: '#2563EB', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>Select from List</Text>
                </TouchableOpacity>
              </View>
              <TextInput style={styles.input} value={jePaidTo} onChangeText={setJePaidTo} placeholder="Entity Name" />
            </View>
          )}

          <DropdownPicker label="Payment Instrument" options={PAYMENT_MODES} selectedValue={jeMode} onSelect={(val) => setJeMode(val as number)} />

          <Text style={styles.inputLabel}>UPI Id / Bank Ref (Optional)</Text>
          <TextInput style={styles.input} value={jeUpiRef} onChangeText={setJeUpiRef} placeholder="UTR or Txn ID" />

          <Text style={styles.inputLabel}>Description</Text>
          <TextInput style={styles.input} value={jeDesc} onChangeText={setJeDesc} placeholder="Description..." multiline numberOfLines={2} />

          <AttachmentField label="Receipts / Proof" files={attachments} onChange={handleAttachmentsChange} />

          <TouchableOpacity style={styles.submitBtn} onPress={handleAddJournalEntry} disabled={submitting || isExtracting}>
            {(submitting || isExtracting) ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Commit Voucher</Text>}
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
  vendorChip: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  vendorChipText: {
    fontSize: 12,
    color: '#374151',
  },
});
