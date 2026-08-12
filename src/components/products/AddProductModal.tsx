import React, { useState, useEffect } from 'react';
import { Theme } from '../../theme';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { ProductService } from '../../api/productService';
import { InventoryService } from '../../api/inventoryService';
import { DropdownPicker, DropdownOption } from '../ui/DropdownPicker';
import type { BomRow, StockLevel } from '../../types';
import { AppAlertStatic } from '../ui/AppAlert';

interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ visible, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<StockLevel[]>([]);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [description, setDescription] = useState('');
  const [bom, setBom] = useState<BomRow[]>([]);

  useEffect(() => {
    if (visible) {
      const fetchInventory = async () => {
        try {
          const inv = await InventoryService.getStockLevels();
          setInventoryItems(inv);
        } catch (e) {
          console.warn('Failed to load inventory for BOM', e);
        }
      };
      fetchInventory();
    }
  }, [visible]);

  const handleAddProduct = async () => {
    if (!name || !sellingPrice) {
      AppAlertStatic.alert('Validation', 'Name and Selling Price are required.');
      return;
    }
    
    const invalidBom = bom.some(b => !b.inventoryItemEntityId || b.quantityConsumed <= 0);
    if (invalidBom) {
      AppAlertStatic.alert('Validation', 'Please ensure all BOM rows have a valid item and quantity greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        sku,
        category,
        description,
        sellingPrice: parseFloat(sellingPrice) || 0,
        inventoryRequirements: bom
      };

      await ProductService.addProduct(payload);
      
      AppAlertStatic.alert('Success', 'Product created successfully!');
      setName(''); setSku(''); setCategory(''); setSellingPrice(''); setDescription(''); setBom([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      AppAlertStatic.alert('Error', err.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const addBomRow = () => {
    setBom([...bom, { inventoryItemEntityId: '', quantityConsumed: 0 }]);
  };

  const updateBomRow = (index: number, field: keyof BomRow, value: string | number) => {
    const newBom = [...bom];
    newBom[index] = { ...newBom[index], [field]: value };
    setBom(newBom);
  };

  const removeBomRow = (index: number) => {
    setBom(bom.filter((_, i) => i !== index));
  };

  const invOptions: DropdownOption[] = inventoryItems.map(i => ({ label: i.name, value: i.entityId }));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Product</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>Cancel</Text></TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Basic Info</Text>
          <Text style={styles.inputLabel}>Product Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Premium Coffee" />
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>SKU</Text>
              <TextInput style={styles.input} value={sku} onChangeText={setSku} placeholder="e.g. COF-01" />
            </View>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Beverages" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Selling Price (₹) *</Text>
              <TextInput style={styles.input} value={sellingPrice} onChangeText={setSellingPrice} placeholder="0.00" keyboardType="numeric" />
            </View>
          </View>

          <Text style={styles.inputLabel}>Description</Text>
          <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Product description..." multiline numberOfLines={2} />

          <View style={styles.bomHeaderContainer}>
            <Text style={[styles.sectionTitle, { marginBottom: 0, borderBottomWidth: 0, paddingBottom: 0, marginTop: 0 }]}>Bill of Materials (BOM)</Text>
            <TouchableOpacity onPress={addBomRow}>
              <Text style={styles.addBomText}>+ Add Item</Text>
            </TouchableOpacity>
          </View>

          {bom.map((row, idx) => (
            <View key={idx} style={styles.bomRow}>
              <View style={styles.bomCol}>
                <Text style={styles.inputLabel}>Inventory Item</Text>
                <DropdownPicker 
                  options={invOptions} 
                  selectedValue={row.inventoryItemEntityId} 
                  onSelect={(val) => updateBomRow(idx, 'inventoryItemEntityId', val as string)} 
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
              <View style={[styles.bomCol, { flex: 0.6 }]}>
                <Text style={styles.inputLabel}>Qty</Text>
                <TextInput 
                  style={[styles.input, { height: 48 }]} 
                  value={row.quantityConsumed ? row.quantityConsumed.toString() : ''} 
                  onChangeText={(val) => updateBomRow(idx, 'quantityConsumed', parseFloat(val) || 0)} 
                  keyboardType="numeric" 
                  placeholder="0"
                />
              </View>
              <View style={{ justifyContent: 'flex-end', height: 75, paddingBottom: 2 }}>
                <TouchableOpacity style={styles.deleteBomBtn} onPress={() => removeBomRow(idx)}>
                  <Text style={styles.deleteBomText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {bom.length === 0 && <Text style={styles.emptyBom}>No inventory items required to make this product.</Text>}

          <TouchableOpacity style={styles.submitBtn} onPress={handleAddProduct} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Save Product</Text>}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4,
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
    marginTop: 8,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
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
  bomHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4,
  },
  addBomText: {
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 14,
  },
  bomRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  bomCol: {
    flex: 1,
  },
  deleteBomBtn: {
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBomText: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  emptyBom: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
  }
});
