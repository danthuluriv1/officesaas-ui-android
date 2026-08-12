import React, { useState, useEffect } from 'react';
import { Theme } from '../../../../theme';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { AppText as Text } from '../../../../components/AppText';
import { useLocalSearchParams } from 'expo-router';
import axiosClient from '../../../../api/axiosClient';
import { DropdownPicker, DropdownOption } from '../../../../components/ui/DropdownPicker';
import { AppAlertStatic } from '../../../../components/ui/AppAlert';

interface InventoryItem {
  entityId: string;
  name: string;
  unitOfMeasure: string;
}

interface BomRow {
  inventoryItemEntityId: string;
  quantityConsumed: number;
}

interface ProductDetail {
  entityId: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  sellingPrice: number;
  totalInventoryCost: number;
  inventoryRequirements: BomRow[];
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [description, setDescription] = useState('');
  const [bom, setBom] = useState<BomRow[]>([]);

  const fetchData = async () => {
    try {
      const [prodRes, invRes] = await Promise.all([
        axiosClient.get(`/Products/${id}`),
        axiosClient.get('/Inventory', { params: { pageSize: 1000 } })
      ]);

      if (prodRes.data?.isSuccess) {
        setProduct(prodRes.data.data);
      } else {
        setProduct(prodRes.data);
      }

      const invData = invRes.data?.data?.items || invRes.data?.items || invRes.data || [];
      setInventoryItems(invData);

    } catch (err) {
      console.warn('Failed to fetch product details', err);
      AppAlertStatic.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleOpenEdit = () => {
    if (!product) return;
    setName(product.name || '');
    setSku(product.sku || '');
    setCategory(product.category || '');
    setSellingPrice(product.sellingPrice ? product.sellingPrice.toString() : '');
    setDescription(product.description || '');
    // Deep copy BOM array to prevent mutation issues
    setBom(product.inventoryRequirements ? JSON.parse(JSON.stringify(product.inventoryRequirements)) : []);
    setModalVisible(true);
  };

  const handleEditProduct = async () => {
    if (!name || !sellingPrice) {
      AppAlertStatic.alert('Validation Error', 'Name and Selling Price are required.');
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
        entityId: id,
        name,
        sku,
        category,
        description,
        sellingPrice: parseFloat(sellingPrice) || 0,
        inventoryRequirements: bom
      };

      const response = await axiosClient.put(`/Products/${id}`, payload);
      if (response.data?.isSuccess) {
        AppAlertStatic.alert('Success', 'Product updated successfully!');
        setModalVisible(false);
        fetchData(); // Refresh details
      } else {
        AppAlertStatic.alert('Error', response.data?.message || 'Failed to update product');
      }
    } catch (err: any) {
      AppAlertStatic.alert('Error', err.response?.data?.message || err.message || 'An error occurred');
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Product not found.</Text>
      </View>
    );
  }

  // Calculate profitability margin based on selling price and BOM cost
  const bomCost = product.totalInventoryCost || 0;
  const sellingPriceNum = product.sellingPrice || 0;
  const profitMargin = sellingPriceNum > 0 ? ((sellingPriceNum - bomCost) / sellingPriceNum) * 100 : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.headerActionsRow}>
          <View style={{ width: 40 }} />
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>📦</Text>
          </View>
          <TouchableOpacity onPress={handleOpenEdit} style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.priceText}>₹{product.sellingPrice}</Text>
        
        {product.category || product.sku ? (
          <View style={styles.badgesRow}>
            {product.sku && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>SKU: {product.sku}</Text>
              </View>
            )}
            {product.category && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{product.category}</Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      {product.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Selling Price</Text>
          <Text style={styles.infoValue}>₹{product.sellingPrice}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>BOM Cost</Text>
          <Text style={[styles.infoValue, { color: '#EF4444' }]}>- ₹{bomCost.toFixed(2)}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomWidth: 0, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }]}>
          <Text style={[styles.infoLabel, { fontWeight: '700', color: '#111827' }]}>Profit Margin</Text>
          <Text style={[styles.infoValue, { color: profitMargin >= 0 ? '#10B981' : '#EF4444', fontWeight: '700' }]}>
            {profitMargin.toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bill of Materials (BOM)</Text>
        {product.inventoryRequirements && product.inventoryRequirements.length > 0 ? (
          <View>
            {product.inventoryRequirements.map((req, idx) => {
              const itemDef = inventoryItems.find(i => i.entityId === req.inventoryItemEntityId);
              return (
                <View key={idx} style={styles.bomItemRow}>
                  <Text style={styles.bomItemName}>{itemDef ? itemDef.name : 'Unknown Item'}</Text>
                  <Text style={styles.bomItemQty}>{req.quantityConsumed} {itemDef ? itemDef.unitOfMeasure : ''}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyBomText}>No inventory materials required for this product.</Text>
        )}
      </View>

      {/* Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Product</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.closeText}>Cancel</Text></TouchableOpacity>
            </View>

            <Text style={styles.sectionTitleModal}>Basic Info</Text>
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
              <Text style={[styles.sectionTitleModal, { marginBottom: 0, borderBottomWidth: 0, paddingBottom: 0, marginTop: 0 }]}>Bill of Materials (BOM)</Text>
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

            <TouchableOpacity style={styles.submitBtn} onPress={handleEditProduct} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  errorText: {
    textAlign: 'center',
    color: '#EF4444',
    marginTop: 20,
    fontSize: 16,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  editBtnText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 12,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  descriptionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  bomItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bomItemName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  bomItemQty: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  emptyBomText: {
    color: '#9CA3AF',
    fontStyle: 'italic',
    fontSize: 14,
  },
  
  // Modal Styles
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
  sectionTitleModal: {
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
  dropdownBtn: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
  },
  dropdownBtnText: {
    fontSize: 14,
    color: '#111827',
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
