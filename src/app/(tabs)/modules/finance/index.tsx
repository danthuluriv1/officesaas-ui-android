import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AppText as Text } from '../../../../components/AppText';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ExpenseModal } from '../../../../components/finance/ExpenseModal';
import { PaymentModal } from '../../../../components/finance/PaymentModal';
import { Ionicons } from '@expo/vector-icons';

export default function FinanceScreen() {
  // Form State
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.list}>
      <View style={styles.actionsContainer}>
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => setExpenseModalVisible(true)}>
            <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="add-circle-outline" size={24} color="#B91C1C" />
            </View>
            <Text style={styles.actionText}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => setPaymentModalVisible(true)}>
            <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="arrow-down-circle-outline" size={24} color="#047857" />
            </View>
            <Text style={styles.actionText}>Receive Payment</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Management</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/modules/finance/payroll')}>
            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="cash-outline" size={24} color="#D97706" />
            </View>
            <Text style={styles.actionText}>Payroll</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/modules/finance/ledger')}>
            <View style={[styles.actionIcon, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="book-outline" size={24} color="#4338CA" />
            </View>
            <Text style={styles.actionText}>Ledger</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/modules/finance/expenses')}>
            <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="receipt-outline" size={24} color="#B91C1C" />
            </View>
            <Text style={styles.actionText}>Expenses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/modules/finance/inflows')}>
            <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="wallet-outline" size={24} color="#047857" />
            </View>
            <Text style={styles.actionText}>Payments</Text>
          </TouchableOpacity>
        </View>
      </View>

      {expenseModalVisible && (
        <ExpenseModal 
          visible={expenseModalVisible} 
          onClose={() => setExpenseModalVisible(false)} 
          onSuccess={() => {}} 
        />
      )}

      {paymentModalVisible && (
        <PaymentModal 
          visible={paymentModalVisible} 
          onClose={() => setPaymentModalVisible(false)} 
          onSuccess={() => {}} 
        />
      )}
    </ScrollView>
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
    flexWrap: 'wrap',
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
    flexGrow: 1,
    flexBasis: 150,
    minWidth: 150,
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
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailCol: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
  balance: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  credit: {
    color: '#059669',
  },
  debit: {
    color: '#DC2626',
  },
});
