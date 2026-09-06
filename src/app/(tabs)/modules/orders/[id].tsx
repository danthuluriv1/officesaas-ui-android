import React, { useState, useEffect } from 'react';
import { Theme } from '../../../../theme';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { AppText as Text } from '../../../../components/AppText';
import { useLocalSearchParams } from 'expo-router';
import axiosClient from '../../../../api/axiosClient';
import { AppAlertStatic } from '../../../../components/ui/AppAlert';
import { OrderFormModal } from '../../../../components/orders/OrderFormModal';

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

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleOpenEdit = () => {
    if (!order) return;
    setModalVisible(true);
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
          <Text style={styles.infoValue}>{order.startDate ? new Date(order.startDate).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>End Date</Text>
          <Text style={styles.infoValue}>{order.endDate ? new Date(order.endDate).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A'}</Text>
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
      <OrderFormModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onSuccess={() => { setModalVisible(false); fetchOrder(); }} 
        initialData={order} 
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
