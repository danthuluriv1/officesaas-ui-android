import React, { useState, useEffect } from 'react';
import { Theme } from '../../../theme';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { OrderService } from '../../../api/orderService';
import { OrderFormModal } from '../../../components/orders/OrderFormModal';

import type { Order } from '../../../types';


export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Add Order Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      const data = await OrderService.getOrders(1, 50);
      setOrders(data);
    } catch (error) {
      console.warn(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const filteredOrders = orders.filter(order => {
    const matchSearch = (order.orderNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    let matchFrom = true;
    let matchTo = true;
    if (order.startDate) {
      const oDate = new Date(order.startDate).getTime();
      if (fromDate) {
        const fDate = new Date(fromDate).getTime();
        if (!isNaN(fDate)) matchFrom = oDate >= fDate;
      }
      if (toDate) {
        const tDate = new Date(toDate).getTime();
        if (!isNaN(tDate)) matchTo = oDate <= tDate;
      }
    }
    return matchSearch && matchFrom && matchTo;
  });



  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push({ pathname: '/(tabs)/modules/orders/[id]', params: { id: item.entityId } } as any)}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>{item.orderNumber || 'Unknown'}</Text>
          <Text style={styles.date}>{item.startDate ? new Date(item.startDate).toLocaleDateString() : ''}</Text>
        </View>
        <View style={[styles.badge, item.status === 'Completed' ? styles.badgeSuccess : styles.badgePending]}>
          <Text style={[styles.badgeText, item.status === 'Completed' ? styles.badgeSuccessText : styles.badgePendingText]}>
            {item.status || 'Draft'}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.amountLabel}>Total Amount</Text>
        <Text style={styles.amount}>₹{(item.totalGrandAmount || 0).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterSection}>
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search by Order ID..." 
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        <View style={styles.dateFilterRow}>
          <View style={styles.dateInputWrapper}>
            <Text style={styles.dateLabel}>From:</Text>
            <TextInput style={styles.dateInput} placeholder="YYYY-MM-DD" value={fromDate} onChangeText={setFromDate} />
          </View>
          <View style={styles.dateInputWrapper}>
            <Text style={styles.dateLabel}>To:</Text>
            <TextInput style={styles.dateInput} placeholder="YYYY-MM-DD" value={toDate} onChangeText={setToDate} />
          </View>
        </View>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => setIsModalOpen(true)}>
          <Text style={styles.actionBtnPrimaryText}>+ Create New Order</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item, index) => item?.entityId?.toString() || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={<Text style={styles.emptyText}>No orders found.</Text>}
        />
      )}

      {isModalOpen && (
        <OrderFormModal 
          visible={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchOrders}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSection: {
    padding: 16,
    paddingBottom: 0,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
  },
  dateFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 6,
    fontWeight: '600',
  },
  dateInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 0,
    gap: 12,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnPrimaryText: {
    fontWeight: '700',
    color: '#ffffff',
    fontSize: 15,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  date: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSuccess: {
    backgroundColor: '#DEF7EC',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeSuccessText: {
    color: '#03543F',
  },
  badgePendingText: {
    color: '#92400E',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 32,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  roleBtnActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  roleBtnText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  roleBtnTextActive: {
    color: '#1D4ED8',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  checkboxActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxCheck: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500'
  },
  dropdownBtn: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  dropdownBtnText: {
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
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  bomRow: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  pickProductBtn: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  pickProductText: {
    color: '#1D4ED8',
    fontWeight: '600',
    fontSize: 12,
  },
  deleteBomBtn: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
  },
  deleteBomText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 12,
  },
  
  // Selector Overlay Styles
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
    paddingBottom: 20,
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  selectorList: {
    padding: 16,
  },
  selectorItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectorItemText: {
    fontSize: 15,
    color: '#111827',
  }
});
