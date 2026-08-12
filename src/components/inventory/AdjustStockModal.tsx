import React, { useState, useEffect } from 'react';
import { Theme } from '../../theme';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { InventoryService } from '../../api/inventoryService';
import { OrderService } from '../../api/orderService';
import { DropdownPicker, DropdownOption } from '../ui/DropdownPicker';
import type { StockLevel, Party } from '../../types';
import { AppAlertStatic } from '../ui/AppAlert';

const ADJUSTMENT_TYPES = [
  { label: 'Inbound (+)', value: 0 },
  { label: 'Outbound (-)', value: 1 },
  { label: 'Correction / Adjustment', value: 2 },
];

interface AdjustStockModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  stockLevels: StockLevel[];
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({ visible, onClose, onSuccess, stockLevels }) => {
  const [submitting, setSubmitting] = useState(false);
  const [vendors, setVendors] = useState<Party[]>([]);
  
  const [adjustItemId, setAdjustItemId] = useState('');
  const [adjustType, setAdjustType] = useState<number>(0);
  const [adjustVendorId, setAdjustVendorId] = useState('');
  const [adjustUnitPrice, setAdjustUnitPrice] = useState('');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  useEffect(() => {
    if (visible) {
      const loadVendors = async () => {
        try {
          const v = await OrderService.getParties('Vendor');
          setVendors(v);
        } catch (e) {
          console.warn('Failed to load vendors', e);
        }
      };
      loadVendors();
    }
  }, [visible]);

  const handleAdjust = async () => {
    if (!adjustItemId || !adjustQty) {
      AppAlertStatic.alert('Validation', 'Item and Quantity are required.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        inventoryItemEntityId: adjustItemId,
        quantityChange: parseFloat(adjustQty),
        type: adjustType,
        notes: adjustNotes,
        unitPrice: adjustUnitPrice ? parseFloat(adjustUnitPrice) : null
      };

      if (adjustType === 0 && adjustVendorId) {
        payload.vendorEntityId = adjustVendorId;
      }

      await InventoryService.adjustStock(payload);
      
      setAdjustItemId(''); setAdjustQty(''); setAdjustType(0); setAdjustNotes(''); setAdjustVendorId(''); setAdjustUnitPrice('');
      onSuccess();
      onClose();
    } catch (err: any) {
      AppAlertStatic.alert('Error', err.response?.data?.message || 'Failed to record adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  const itemOptions: DropdownOption[] = stockLevels.map(s => ({ label: s.name, value: s.entityId }));
  const vendorOptions: DropdownOption[] = [{ label: 'No Vendor', value: '' }, ...vendors.map(v => ({ label: v.companyName, value: v.entityId }))];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Adjustment</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>Cancel</Text></TouchableOpacity>
          </View>

          <DropdownPicker label="Inventory Item *" options={itemOptions} selectedValue={adjustItemId} onSelect={(val) => setAdjustItemId(val as string)} />
          
          <DropdownPicker label="Type *" options={ADJUSTMENT_TYPES} selectedValue={adjustType} onSelect={(val) => setAdjustType(val as number)} />
          
          {adjustType === 0 && (
            <DropdownPicker label="Vendor (Optional)" options={vendorOptions} selectedValue={adjustVendorId} onSelect={(val) => setAdjustVendorId(val as string)} />
          )}

          <Text style={styles.inputLabel}>Quantity Change *</Text>
          <TextInput style={styles.input} value={adjustQty} onChangeText={setAdjustQty} placeholder="e.g. 50" keyboardType="numeric" />
          
          <Text style={styles.inputLabel}>Update Unit Price (Optional)</Text>
          <TextInput style={styles.input} value={adjustUnitPrice} onChangeText={setAdjustUnitPrice} placeholder="Leave empty to keep current" keyboardType="numeric" />
          
          <Text style={styles.inputLabel}>Notes</Text>
          <TextInput style={styles.input} value={adjustNotes} onChangeText={setAdjustNotes} placeholder="Reason for adjustment..." multiline numberOfLines={2} />
          
          <TouchableOpacity style={styles.submitBtn} onPress={handleAdjust} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Adjustment</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
