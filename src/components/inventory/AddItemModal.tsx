import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { Theme } from '../../theme';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { InventoryService } from '../../api/inventoryService';
import { DropdownPicker } from '../ui/DropdownPicker';
import { AppAlertStatic } from '../ui/AppAlert';

const UNIT_OPTIONS = [
  { label: 'Units', value: 'Units' },
  { label: 'Pieces', value: 'Pieces' },
  { label: 'Boxes', value: 'Boxes' },
  { label: 'Kg', value: 'Kg' },
  { label: 'Grams', value: 'Grams' },
  { label: 'Liters', value: 'Liters' },
];

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ visible, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  const handleAddItem = async () => {
    if (!newItemName || !newItemUnit) {
      AppAlertStatic.alert('Validation', 'Name and Unit are required.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: newItemName,
        unitOfMeasure: newItemUnit,
        quantityOnHand: parseFloat(newItemQuantity) || 0,
        unitPrice: parseFloat(newItemPrice) || 0
      };
      await InventoryService.addItem(payload);
      
      setNewItemName(''); setNewItemUnit(''); setNewItemQuantity(''); setNewItemPrice('');
      onSuccess();
      onClose();
    } catch (err: any) {
      AppAlertStatic.alert('Error', err.response?.data?.message || 'Failed to add item');
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
            <Text style={styles.modalTitle}>Add Inventory Item</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>Cancel</Text></TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Item Name *</Text>
          <TextInput style={styles.input} value={newItemName} onChangeText={setNewItemName} placeholder="e.g. Steel Screws" />
          
          <Text style={styles.inputLabel}>Unit of Measure *</Text>
          <DropdownPicker options={UNIT_OPTIONS} selectedValue={newItemUnit} onSelect={(val) => setNewItemUnit(val as string)} containerStyle={{ marginBottom: 0 }} />
          
          <Text style={styles.inputLabel}>Initial Quantity *</Text>
          <TextInput style={styles.input} value={newItemQuantity} onChangeText={setNewItemQuantity} placeholder="0" keyboardType="numeric" />
          
          <Text style={styles.inputLabel}>Unit Price (₹)</Text>
          <TextInput style={styles.input} value={newItemPrice} onChangeText={setNewItemPrice} placeholder="0.00" keyboardType="numeric" />
          
          <TouchableOpacity style={styles.submitBtn} onPress={handleAddItem} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Add Item</Text>}
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
