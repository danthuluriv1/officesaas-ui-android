import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, Text as RNText, Platform } from 'react-native';
import { AppText as Text } from '../../../../components/AppText';
import { FinanceService } from '../../../../api/financeService';
import { TransactionDetailsModal } from '../../../../components/finance/TransactionDetailsModal';
import type { LedgerEntry } from '../../../../types';
import { AppAlertStatic } from '../../../../components/ui/AppAlert';
import { Theme } from '../../../../theme';
import { Stack as ExpoStack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DropdownPicker } from '../../../../components/ui/DropdownPicker';
import { CollapsibleFilters, FilterConfig } from '../../../../components/ui/CollapsibleFilters';


export default function LedgerScreen() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<LedgerEntry | null>(null);

  // Filter State
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<string>('');

  const fetchLedger = async () => {
    try {
      const activeFilters = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        transactionType: transactionType || undefined
      };
      const data = await FinanceService.getLedger(1, 100, activeFilters);
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
  }, [startDate, endDate, transactionType]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLedger();
  };

  const renderItem = ({ item }: { item: LedgerEntry }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedTransaction(item)} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.description}>{item.description || 'Entry'}</Text>
        <Text style={styles.date}>{item.postingDate ? new Date(item.postingDate).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''}</Text>
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

  return (
    <View style={styles.container}>
      <ExpoStack.Screen 
        options={{ 
          title: 'Ledger',
          headerRight: () => (
            null
          )
        }} 
      />
      
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <>
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <CollapsibleFilters
          title="Filters"
          initialExpanded={false}
          filters={[
            {
              id: 'startDate',
              label: 'From:',
              type: 'date',
              value: startDate,
              onChange: setStartDate
            },
            {
              id: 'endDate',
              label: 'To:',
              type: 'date',
              value: endDate,
              onChange: setEndDate
            },
            {
              id: 'type',
              label: 'Transaction Type',
              type: 'dropdown',
              value: transactionType,
              onChange: setTransactionType,
              placeholder: 'All Types',
              options: [
                { label: 'All Types', value: '' },
                { label: 'Debit (Outflow)', value: 'Debit' },
                { label: 'Credit (Inflow)', value: 'Credit' }
              ]
            }
          ]}
        />
      </View>
      <FlatList
          data={ledger}
          keyExtractor={(item, index) => item?.entityId?.toString() || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={<Text style={styles.emptyText}>No financial records match your filters.</Text>}
        />
        </>
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
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { marginBottom: 12 },
  description: { fontSize: 16, fontWeight: '600', color: '#111827' },
  date: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  detailCol: { flex: 1 },
  label: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  amount: { fontSize: 14, fontWeight: '600' },
  balance: { fontSize: 16, fontWeight: '700', color: '#111827' },
  credit: { color: '#059669' },
  debit: { color: '#DC2626' },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 40, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20 },
  formGroup: { marginBottom: 16 },
  row: { flexDirection: 'row' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#F9FAFB', minHeight: 45, justifyContent: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  clearBtn: { paddingVertical: 12 },
  clearBtnText: { color: '#DC2626', fontWeight: '600', fontSize: 15 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#F3F4F6' },
  cancelBtnText: { color: '#374151', fontWeight: '600', fontSize: 15 },
  applyBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#2563EB' },
  applyBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 }
});
