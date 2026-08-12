import React, { useState, useEffect } from 'react';
import { Theme } from '../../../../theme';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { AppText as Text } from '../../../../components/AppText';
import { useLocalSearchParams } from 'expo-router';
import axiosClient from '../../../../api/axiosClient';
import { AppAlertStatic } from '../../../../components/ui/AppAlert';

interface LineItem {
  name?: string;
  description: string;
  hsN_SAC_Code: string;
  quantity: number;
  rate: number;
  taxPercentage: number;
  totalTaxableValue: number;
  taxAmount: number;
  totalAmount: number;
}

interface Product {
  entityId: string;
  name: string;
  sku: string;
  sellingPrice: number;
  description?: string;
}

// Reusable Selector Modal Component
const SelectorModal = ({ visible, title, items, onSelect, onClose, displayKey = 'name', valKey = 'entityId' }: any) => (
  <Modal visible={visible} animationType="fade" transparent>
    <View style={styles.selectorOverlay}>
      <View style={styles.selectorContent}>
        <View style={styles.selectorHeader}>
          <Text style={styles.selectorTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
        </View>
        <ScrollView style={styles.selectorList}>
          {items.map((item: any, idx: number) => (
            <TouchableOpacity 
              key={item[valKey] || idx} 
              style={styles.selectorItem}
              onPress={() => onSelect(item)}
            >
              <Text style={styles.selectorItemText}>{item[displayKey]}</Text>
            </TouchableOpacity>
          ))}
          {items.length === 0 && <Text style={styles.emptyText}>No items found.</Text>}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

interface OrderDetail {
  entityId: string;
  orderNumber: string;
  orderType: string;
  associatedPartyEntityId: string;
  partyNameSnapshot: string;
  startDate: string;
  endDate: string;
  status: string;
  paymentStatus: string;
  termsAndConditions: string;
  totalTaxableAmount: number;
  totalTaxAmount: number;
  totalGrandAmount: number;
  items: LineItem[];
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState(0); // 0 = Pending, 1 = Completed, 2 = Cancelled
  const [paymentStatus, setPaymentStatus] = useState(0); // 0 = Pending, 1 = Paid
  const [terms, setTerms] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);

  // Product Selection State
  const [products, setProducts] = useState<Product[]>([]);
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  const fetchOrder = async () => {
    try {
      const response = await axiosClient.get(`/Billing/orders/${id}`);
      if (response.data?.isSuccess) {
        setOrder(response.data.data);
      } else {
        setOrder(response.data);
      }
    } catch (err) {
      console.warn('Failed to fetch order details', err);
      AppAlertStatic.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axiosClient.get('/Products', { params: { pageSize: 100 } });
      if (res.data?.isSuccess) {
        const payload = res.data.data;
        setProducts(Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []));
      }
    } catch (e) {
      console.warn("Failed to fetch products", e);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
    fetchProducts();
  }, [id]);

  const handleOpenEdit = () => {
    if (!order) return;
    setStartDate(order.startDate ? new Date(order.startDate).toISOString().substring(0, 10) : '');
    setEndDate(order.endDate ? new Date(order.endDate).toISOString().substring(0, 10) : '');
    setStatus(order.status === 'Completed' ? 1 : order.status === 'Cancelled' ? 2 : 0);
    setPaymentStatus(order.paymentStatus === 'Paid' ? 1 : 0);
    setTerms(order.termsAndConditions || '');
    setItems(order.items ? JSON.parse(JSON.stringify(order.items)) : []);
    setModalVisible(true);
  };

  const addItemRow = () => setItems([...items, { name: '', description: '', hsN_SAC_Code: '', quantity: 1, rate: 0, taxPercentage: 0, totalTaxableValue: 0, taxAmount: 0, totalAmount: 0 }]);
  const updateItem = (index: number, field: keyof LineItem, val: string | number) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = { ...newItems[index], [field]: val };
      return newItems;
    });
  };
  const removeItemRow = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));

  const applyProductToRow = (product: Product, index: number) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = { 
        ...newItems[index], 
        name: product.name, 
        description: product.description || product.name,
        rate: product.sellingPrice
      };
      return newItems;
    });
  };

  const handleEditOrder = async () => {
    if (!order) return;
    setSubmitting(true);
    try {
      const payload = {
        orderType: order.orderType,
        associatedPartyEntityId: order.associatedPartyEntityId,
        partyNameSnapshot: order.partyNameSnapshot,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        status,
        paymentStatus,
        termsAndConditions: terms,
        items: items.map(i => ({
          name: i.name,
          description: i.description,
          hsN_SAC_Code: i.hsN_SAC_Code,
          quantity: i.quantity,
          rate: i.rate,
          taxPercentage: i.taxPercentage
        }))
      };

      const response = await axiosClient.put(`/Billing/orders/${id}`, payload);
      if (response.data?.isSuccess) {
        AppAlertStatic.alert('Success', 'Order updated successfully!');
        setModalVisible(false);
        fetchOrder();
      } else {
        AppAlertStatic.alert('Error', response.data?.message || 'Failed to update order');
      }
    } catch (err: any) {
      AppAlertStatic.alert('Error', err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Order not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.headerActionsRow}>
          <View style={{ width: 40 }} />
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>📑</Text>
          </View>
          <TouchableOpacity onPress={handleOpenEdit} style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.orderId}>{order.orderNumber || 'Draft Order'}</Text>
        <Text style={styles.partyName}>{order.partyNameSnapshot || 'Unknown Party'}</Text>
        
        <View style={styles.badgesRow}>
          <View style={[styles.badge, order.status === 'Completed' ? styles.badgeSuccess : styles.badgePending]}>
            <Text style={[styles.badgeText, order.status === 'Completed' ? styles.badgeSuccessText : styles.badgePendingText]}>
              {order.status || 'Pending'}
            </Text>
          </View>
          <View style={[styles.badge, order.paymentStatus === 'Paid' ? styles.badgeSuccess : styles.badgePending]}>
            <Text style={[styles.badgeText, order.paymentStatus === 'Paid' ? styles.badgeSuccessText : styles.badgePendingText]}>
              {order.paymentStatus || 'Unpaid'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Start Date</Text>
          <Text style={styles.infoValue}>{order.startDate ? new Date(order.startDate).toLocaleDateString() : 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>End Date</Text>
          <Text style={styles.infoValue}>{order.endDate ? new Date(order.endDate).toLocaleDateString() : 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Order Type</Text>
          <Text style={styles.infoValue}>{order.orderType}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Line Items</Text>
        {order.items && order.items.length > 0 ? (
          order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name ? `${item.name} - ${item.description}` : item.description}</Text>
                <Text style={styles.itemTotal}>₹{item.totalAmount?.toLocaleString()}</Text>
              </View>
              <Text style={styles.itemDetails}>
                Qty: {item.quantity} × ₹{item.rate} (Tax: {item.taxPercentage}%)
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No items found in this order.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Summary</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Taxable Amount</Text>
          <Text style={styles.infoValue}>₹{(order.totalTaxableAmount || 0).toLocaleString()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tax Amount</Text>
          <Text style={styles.infoValue}>₹{(order.totalTaxAmount || 0).toLocaleString()}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomWidth: 0, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }]}>
          <Text style={[styles.infoLabel, { fontWeight: '800', color: '#111827' }]}>Grand Total</Text>
          <Text style={[styles.infoValue, { color: '#059669', fontWeight: '800', fontSize: 18 }]}>
            ₹{(order.totalGrandAmount || 0).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Order</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.closeText}>Cancel</Text></TouchableOpacity>
            </View>

            <Text style={styles.sectionTitleModal}>Dates</Text>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Start Date *</Text>
                <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
              </View>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>End Date *</Text>
                <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />
              </View>
            </View>

            <Text style={styles.sectionTitleModal}>Status Configuration</Text>
            <Text style={styles.inputLabel}>Order Status</Text>
            <View style={styles.roleContainer}>
              {[
                { label: 'Pending', value: 0 },
                { label: 'Completed', value: 1 },
                { label: 'Cancelled', value: 2 }
              ].map(s => (
                <TouchableOpacity 
                  key={s.value} 
                  style={[styles.roleBtn, status === s.value && styles.roleBtnActive]}
                  onPress={() => setStatus(s.value)}
                >
                  <Text style={[styles.roleBtnText, status === s.value && styles.roleBtnTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Payment Status</Text>
            <View style={styles.roleContainer}>
              {[
                { label: 'Pending', value: 0 },
                { label: 'Paid', value: 1 }
              ].map(s => (
                <TouchableOpacity 
                  key={s.value} 
                  style={[styles.roleBtn, paymentStatus === s.value && styles.roleBtnActive]}
                  onPress={() => setPaymentStatus(s.value)}
                >
                  <Text style={[styles.roleBtnText, paymentStatus === s.value && styles.roleBtnTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.bomHeaderContainer}>
              <Text style={[styles.sectionTitleModal, { marginBottom: 0 }]}>Line Items</Text>
              <TouchableOpacity onPress={addItemRow}>
                <Text style={styles.addBomText}>+ Add Item</Text>
              </TouchableOpacity>
            </View>

            {items.map((row, idx) => (
              <View key={idx} style={styles.bomRow}>
                <View style={[styles.row, { marginBottom: 8 }]}>
                  <View style={[styles.col, { flex: 1.5 }]}>
                    <Text style={styles.inputLabel}>Name *</Text>
                    <TextInput style={styles.input} value={row.name} onChangeText={(v) => updateItem(idx, 'name', v)} placeholder="Item Name..." />
                  </View>
                  <View style={[styles.col, { flex: 2 }]}>
                    <Text style={styles.inputLabel}>Description *</Text>
                    <TextInput style={styles.input} value={row.description} onChangeText={(v) => updateItem(idx, 'description', v)} placeholder="Item desc..." />
                  </View>
                  <View style={{ justifyContent: 'flex-end', paddingBottom: 4 }}>
                    <TouchableOpacity 
                      style={styles.pickProductBtn}
                      onPress={() => {
                        setActiveItemIndex(idx);
                        setProductSelectorOpen(true);
                      }}
                    >
                      <Text style={styles.pickProductText}>Pick</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>Rate (₹) *</Text>
                    <TextInput style={styles.input} value={row.rate || row.rate === 0 ? row.rate.toString() : ''} onChangeText={(v) => updateItem(idx, 'rate', parseFloat(v) || 0)} keyboardType="numeric" placeholder="0" />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>Qty *</Text>
                    <TextInput style={styles.input} value={row.quantity ? row.quantity.toString() : ''} onChangeText={(v) => updateItem(idx, 'quantity', parseFloat(v) || 0)} keyboardType="numeric" placeholder="1" />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>Tax (%)</Text>
                    <TextInput style={styles.input} value={row.taxPercentage || row.taxPercentage === 0 ? row.taxPercentage.toString() : ''} onChangeText={(v) => updateItem(idx, 'taxPercentage', parseFloat(v) || 0)} keyboardType="numeric" placeholder="0" />
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
                   <TouchableOpacity style={styles.deleteBomBtn} onPress={() => removeItemRow(idx)}>
                      <Text style={styles.deleteBomText}>Remove Item</Text>
                   </TouchableOpacity>
                </View>
              </View>
            ))}

            <Text style={[styles.sectionTitleModal, { marginTop: 24 }]}>Additional Details</Text>
            <Text style={styles.inputLabel}>Terms & Conditions</Text>
            <TextInput style={styles.input} value={terms} onChangeText={setTerms} placeholder="Enter terms..." multiline numberOfLines={3} />

            <TouchableOpacity style={styles.submitBtn} onPress={handleEditOrder} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <SelectorModal 
        visible={productSelectorOpen} 
        title="Select Product"
        items={products} 
        displayKey="name"
        onSelect={(item: Product) => {
          if (activeItemIndex !== null) {
            applyProductToRow(item, activeItemIndex);
          }
          setProductSelectorOpen(false);
        }} 
        onClose={() => setProductSelectorOpen(false)} 
      />
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
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
  },
  orderId: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  partyName: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeSuccessText: {
    color: '#065F46',
  },
  badgePendingText: {
    color: '#92400E',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
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
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  itemRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  itemDetails: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingVertical: 12,
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
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  roleBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  roleBtnActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  roleBtnText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  roleBtnTextActive: {
    color: '#1D4ED8',
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
    marginTop: 16,
    marginBottom: 8,
  },
  addBomText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  bomRow: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  pickProductBtn: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  pickProductText: {
    color: '#1D4ED8',
    fontWeight: '600',
    fontSize: 12,
  },
  deleteBomBtn: {
    padding: 4,
  },
  deleteBomText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  selectorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  selectorContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  selectorList: {
    padding: 16,
  },
  selectorItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectorItemText: {
    fontSize: 16,
    color: '#374151',
  }
});
