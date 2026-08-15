import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../../../../components/AppText';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FinanceService } from '../../../../api/financeService';
import { ExpenseModal } from '../../../../components/finance/ExpenseModal';
import { PaymentModal } from '../../../../components/finance/PaymentModal';
import { TransactionDetailsModal } from '../../../../components/finance/TransactionDetailsModal';
import type { LedgerEntry } from '../../../../types';
import { AppAlertStatic } from '../../../../components/ui/AppAlert';

export default function FinanceScreen() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form State
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<LedgerEntry | null>(null);

  const fetchLedger = async () => {
    try {
      const data = await FinanceService.getLedger(1, 50);
      setLedger(data);
    } catch (error) {
      console.error(error);
      AppAlertStatic.alert('Error', 'Failed to load financial ledger');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const params = useLocalSearchParams<{ action?: string }>();
  const router = useRouter();

  useEffect(() => {
    if (params.action === 'addExpense') {
      setExpenseModalVisible(true);
      router.setParams({ action: '' });
    } else if (params.action === 'addPayment') {
      setPaymentModalVisible(true);
      router.setParams({ action: '' });
    }
  }, [params.action]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLedger();
  };

  const renderHeader = () => (
    <View style={styles.actionsContainer}>
      {/* <Text style={styles.sectionTitle}>Overview</Text> */}
      <View style={styles.actionsRow}>
        {/* <TouchableOpacity style={styles.navCard} onPress={() => router.push('/(tabs)/modules/finance/expenses')}>
          <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
            <Text style={styles.iconText}>📉</Text>
          </View>
          <Text style={styles.actionText}>All Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navCard} onPress={() => router.push('/(tabs)/modules/finance/inflows')}>
          <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
            <Text style={styles.iconText}>📈</Text>
          </View>
          <Text style={styles.actionText}>All Inflows</Text>
        </TouchableOpacity> */}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionCard} onPress={() => setExpenseModalVisible(true)}>
          <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
            <Text style={styles.iconText}>💸</Text>
          </View>
          <Text style={styles.actionText}>Add Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => setPaymentModalVisible(true)}>
          <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
            <Text style={styles.iconText}>💳</Text>
          </View>
          <Text style={styles.actionText}>Receive Payment</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 8 }]}>Recent Activity</Text>
    </View>
  );

  const renderItem = ({ item }: { item: LedgerEntry }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedTransaction(item)} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.description}>{item.description || 'Entry'}</Text>
        <Text style={styles.date}>{item.postingDate ? new Date(item.postingDate).toLocaleDateString() : ''}</Text>
      </View>
      
      <View style={styles.detailsRow}>
        <View style={styles.detailCol}>
          <Text style={styles.label}>Type</Text>
          <Text style={[styles.amount, item.type === 'Credit' ? styles.credit : styles.debit]}>{item.type || 'Debit'}</Text>
        </View>
        <View style={styles.detailCol}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.balance}>₹{(item.amount || 0).toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={ledger}
        keyExtractor={(item, index) => item?.entityId?.toString() || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<Text style={styles.emptyText}>No financial records found.</Text>}
      />

      {expenseModalVisible && (
        <ExpenseModal 
          visible={expenseModalVisible} 
          onClose={() => setExpenseModalVisible(false)} 
          onSuccess={fetchLedger} 
        />
      )}

      {paymentModalVisible && (
        <PaymentModal 
          visible={paymentModalVisible} 
          onClose={() => setPaymentModalVisible(false)} 
          onSuccess={fetchLedger} 
        />
      )}

      {selectedTransaction && (
        <TransactionDetailsModal
          visible={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          transaction={selectedTransaction}
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
  list: {
    padding: 16,
  },
  actionsContainer: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  navCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
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
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  date: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
  },
  debit: {
    color: '#DC2626',
  },
  credit: {
    color: '#059669',
  },
  balance: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 32,
  }
});
