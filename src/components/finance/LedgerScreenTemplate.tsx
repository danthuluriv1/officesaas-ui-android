import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { AppText as Text } from '../AppText';
import { FinanceService } from '../../api/financeService';
import type { LedgerEntry, JournalEntryItem } from '../../types';
import { type JournalEntriesFilter } from '../../api/financeService';
import { AppAlertStatic } from '../ui/AppAlert';
import { TransactionDetailsModal } from './TransactionDetailsModal';
import { PieChart } from 'react-native-chart-kit';
import { DatePickerField } from '../ui/DatePickerField';
import { CollapsibleFilters, FilterConfig } from '../ui/CollapsibleFilters';
import { DropdownPicker } from '../ui/DropdownPicker';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

interface LedgerScreenTemplateProps {
  title: string;
  typeFilter: 'Debit' | 'Credit';
  colorTheme: string;
  defaultCategory: string;
  emptyMessage: string;
  actionButtonText: string;
  onActionPress: () => void;
  renderModals: (onSuccess: () => void) => React.ReactNode;
  dataSource?: 'journal-entries' | 'payments';
}

export function LedgerScreenTemplate({
  title,
  typeFilter,
  colorTheme,
  defaultCategory,
  emptyMessage,
  actionButtonText,
  onActionPress,
  renderModals,
  dataSource = 'journal-entries'
}: LedgerScreenTemplateProps) {
  const [ledger, setLedger] = useState<JournalEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<JournalEntryItem | null>(null);

  // Filters
  const [filterData, setFilterData] = useState<{categories: string[], paidTo: string[], paidBy?: string[]}>({ categories: [], paidTo: [], paidBy: [] });
  const [selectedPaidTo, setSelectedPaidTo] = useState<string>('');
  const [isFiltersExpanded, setIsFiltersExpanded] = useState<boolean>(false);
  
  const [startDate, setStartDate] = useState<string | null>(() => {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const qStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
    return qStart.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState<string | null>(() => {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const qEnd = new Date(now.getFullYear(), currentQuarter * 3 + 3, 0);
    return qEnd.toISOString().split('T')[0];
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const fetchData = async () => {
    try {
      const filters = await FinanceService.getLedgerFilters();
      setFilterData(filters);

      if (dataSource === 'payments') {
        const result = await FinanceService.getPayments({
          from: startDate,
          to: endDate,
          paymentType: typeFilter === 'Credit' ? 'ReceivedFromClient' : 'MadeToVendor',
          paidBy: selectedPaidTo || undefined,
          pageNumber: 1,
          pageSize: 200,
        });
        
        // Map to common format
        const mapped = result.items.map((p: any) => ({
          ...p,
          totalAmount: p.amount,
          expenseCategory: 'Revenue',
          postingDate: p.paymentDate,
          paidTo: p.paidBy || '',
          description: p.remarks || 'Payment'
        }));
        setLedger(mapped);
      } else {
        const result = await FinanceService.getJournalEntries({
          from: startDate,
          to: endDate,
          category: selectedCategory || undefined,
          paidTo: selectedPaidTo || undefined,
          pageNumber: 1,
          pageSize: 200,
        });
        setLedger(result.items);
      }
    } catch (error) {
      console.error(error);
      AppAlertStatic.alert('Error', `Failed to load ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedCategory, selectedPaidTo]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredLedger = ledger;

  const uniqueCategories = Array.from(new Set(ledger.map(i => i.accountCategory || defaultCategory)));

  const getChartData = () => {
    const categories: Record<string, number> = {};
    filteredLedger.forEach(item => {
      const cat = item.expenseCategory || defaultCategory;
      categories[cat] = (categories[cat] || 0) + (item.totalAmount || 0);
    });

    const colors = typeFilter === 'Debit' 
      ? ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']
      : ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];
    
    return Object.keys(categories).map((key, index) => ({
      name: key,
      population: categories[key],
      color: colors[index % colors.length],
      legendFontColor: '#374151',
      legendFontSize: 12
    })).filter(d => d.population > 0);
  };

  const chartData = getChartData();
  const totalAmount = ledger.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);



  const renderHeader = () => (
    <View style={styles.headerContainer}>
      

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
          ...(dataSource === 'payments' ? [
            {
              id: 'paidBy',
              label: 'Paid By',
              type: 'dropdown' as const,
              value: selectedPaidTo,
              onChange: setSelectedPaidTo, // We reuse selectedPaidTo state for Paid By
              placeholder: 'Any Payer',
              // We could fetch actual payers, but for now we fallback to the paidTo list which might be empty or similar, ideally we should just use text input if it was supported, or just empty options
              // Actually, since we don't have distinct PaidBy from backend yet, let's just make it a dropdown with no options other than All for now, or maybe the user just wants the label changed.
              // Wait, we can extract unique 'paidTo' (mapped from paidBy) from the fetched ledger data itself as a fallback!
              options: [{ label: 'All', value: '' }, ...(filterData.paidBy || []).map(p => ({ label: p, value: p }))]
            }
          ] : [
            {
              id: 'category',
              label: 'Category',
              type: 'dropdown' as const,
              value: selectedCategory,
              onChange: setSelectedCategory,
              placeholder: 'Any Category',
              options: [{ label: 'All', value: '' }, ...filterData.categories.map(c => ({ label: c, value: c }))]
            },
            {
              id: 'paidTo',
              label: 'Paid To',
              type: 'dropdown' as const,
              value: selectedPaidTo,
              onChange: setSelectedPaidTo,
              placeholder: 'Any Paid To',
              options: [{ label: 'All', value: '' }, ...filterData.paidTo.map(p => ({ label: p, value: p }))]
            }
          ])
        ]}
      />
      
      {chartData.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Breakdown</Text>
          <Text style={[styles.totalText, { color: colorTheme }]}>Total: ₹{totalAmount.toLocaleString()}</Text>
          <PieChart
            data={chartData}
            width={screenWidth - 64}
            height={200}
            chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            center={[10, 0]}
            absolute
          />
        </View>
      )}


      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitleRow}>Transactions</Text>
        <TouchableOpacity style={[styles.inlineAddBtn, { backgroundColor: colorTheme }]} onPress={onActionPress}>
          <Ionicons name="add" size={18} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.inlineAddBtnText}>{actionButtonText.replace('+ ', '')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: JournalEntryItem }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedTransaction(item)} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.description}>{item.description || item.paidTo || 'Entry'}</Text>
        <Text style={styles.date}>{item.postingDate ? new Date(item.postingDate).toLocaleDateString() : ''}</Text>
      </View>
      
      <View style={styles.detailsRow}>
        <View style={styles.detailCol}>
          <Text style={styles.label}>{dataSource === 'payments' ? 'Paid By' : 'Category'}</Text>
          <Text style={[styles.amount, styles.debit]}>{dataSource === 'payments' ? (item.paidTo || '-') : (item.expenseCategory || defaultCategory)}</Text>
        </View>
        <View style={styles.detailCol}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.balance}>₹{(item.totalAmount || 0).toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colorTheme} />
        </View>
      ) : (
        <FlatList
          data={filteredLedger}
          keyExtractor={(item, index) => item?.entityId?.toString() || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={renderHeader}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={<Text style={styles.emptyText}>{emptyMessage}</Text>}
        />
      )}

      {selectedTransaction && (
        <TransactionDetailsModal
          visible={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          transaction={selectedTransaction}
        />
      )}

      {renderModals(() => {
        setRefreshing(true);
        fetchData();
      })}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  headerContainer: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 24 },
  chartContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  chartTitle: { fontSize: 16, fontWeight: '700', color: '#374151', alignSelf: 'flex-start', marginBottom: 4 },
  totalText: { fontSize: 24, fontWeight: '800', alignSelf: 'flex-start', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  addButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  filtersContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  dateFilterRow: { flexDirection: 'row', gap: 12 },
  dateInputWrapper: { flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12 },
  dateLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  dateInputText: { fontSize: 15, fontWeight: '600', color: '#111827' },
  categoryFilterList: { marginTop: 8 },
  categoryPill: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  categoryPillText: { color: '#4B5563', fontWeight: '600', fontSize: 14 },
  categoryPillTextSelected: { color: '#fff' },
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
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitleRow: { fontSize: 18, fontWeight: '700', color: '#111827' },
  inlineAddBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16 },
  inlineAddBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' }
});
















