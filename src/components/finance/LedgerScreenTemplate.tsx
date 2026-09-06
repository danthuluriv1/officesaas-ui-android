import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { AppText as Text } from '../AppText';
import { FinanceService } from '../../api/financeService';
import type { LedgerEntry } from '../../types';
import { AppAlertStatic } from '../ui/AppAlert';
import { TransactionDetailsModal } from './TransactionDetailsModal';
import { PieChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';

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
}

export function LedgerScreenTemplate({
  title,
  typeFilter,
  colorTheme,
  defaultCategory,
  emptyMessage,
  actionButtonText,
  onActionPress,
  renderModals
}: LedgerScreenTemplateProps) {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<LedgerEntry | null>(null);

  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const fetchData = async () => {
    try {
      const data = await FinanceService.getLedger(1, 100);
      const isDebit = typeFilter === 'Debit';
      const filteredData = data.filter(item => 
        isDebit ? (item.type === 'Debit' || item.type === '0' || item.type === 0) 
                : (item.type === 'Credit' || item.type === '1' || item.type === 1)
      );
      setLedger(filteredData);
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
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredLedger = ledger.filter(item => {
    if (selectedCategory && (item.accountCategory || defaultCategory) !== selectedCategory) return false;
    if (startDate && new Date(item.postingDate) < new Date(startDate)) return false;
    if (endDate && new Date(item.postingDate) > new Date(`${endDate}T23:59:59`)) return false;
    return true;
  });

  const uniqueCategories = Array.from(new Set(ledger.map(i => i.accountCategory || defaultCategory)));

  const getChartData = () => {
    const categories: Record<string, number> = {};
    filteredLedger.forEach(item => {
      const cat = item.accountCategory || defaultCategory;
      categories[cat] = (categories[cat] || 0) + (item.amount || 0);
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
  const totalAmount = chartData.reduce((acc, curr) => acc + curr.population, 0);

  const onChangeStart = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowStartPicker(false);
    if (selectedDate) setStartDate(selectedDate.toISOString());
  };

  const onChangeEnd = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowEndPicker(false);
    if (selectedDate) setEndDate(selectedDate.toISOString());
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>{title}</Text>
      
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

      <TouchableOpacity style={[styles.addButton, { backgroundColor: colorTheme }]} onPress={onActionPress}>
        <Text style={styles.addButtonText}>{actionButtonText}</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Filters</Text>
      <View style={styles.filtersContainer}>
        <View style={styles.dateFilterRow}>
          <TouchableOpacity style={styles.dateInputWrapper} onPress={() => setShowStartPicker(true)}>
            <Text style={styles.dateLabel}>From:</Text>
            <Text style={styles.dateInputText}>{startDate || 'Any'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateInputWrapper} onPress={() => setShowEndPicker(true)}>
            <Text style={styles.dateLabel}>To:</Text>
            <Text style={styles.dateInputText}>{endDate || 'Any'}</Text>
          </TouchableOpacity>
        </View>
        
        {showStartPicker && (
          <DateTimePicker value={startDate ? new Date(startDate) : new Date()} mode="date" display="default" onValueChange={onChangeStart} />
        )}
        {showEndPicker && (
          <DateTimePicker value={endDate ? new Date(endDate) : new Date()} mode="date" display="default" onValueChange={onChangeEnd} />
        )}

        {uniqueCategories.length > 0 && (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['All', ...uniqueCategories]}
            keyExtractor={item => item}
            style={styles.categoryFilterList}
            renderItem={({ item }) => {
              const isSelected = item === 'All' ? selectedCategory === '' : selectedCategory === item;
              return (
                <TouchableOpacity 
                  style={[styles.categoryPill, isSelected && { backgroundColor: colorTheme }]}
                  onPress={() => setSelectedCategory(item === 'All' ? '' : item)}
                >
                  <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextSelected]}>{item}</Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      <Text style={styles.sectionTitle}>History</Text>
    </View>
  );

  const renderItem = ({ item }: { item: LedgerEntry }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedTransaction(item)} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.description}>{item.description || 'Entry'}</Text>
        <Text style={styles.date}>{item.postingDate ? new Date(item.postingDate).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''}</Text>
      </View>
      <View style={styles.detailsRow}>
        <View style={styles.detailCol}>
          <Text style={styles.label}>Category</Text>
          <Text style={styles.categoryText}>{item.accountCategory || defaultCategory}</Text>
        </View>
        <View style={styles.detailCol}>
          <Text style={styles.label}>Amount</Text>
          <Text style={[styles.amount, { color: colorTheme }]}>₹{(item.amount || 0).toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colorTheme} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredLedger}
        keyExtractor={(item, index) => item?.entityId?.toString() || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<Text style={styles.emptyText}>{emptyMessage}</Text>}
      />

      {renderModals(fetchData)}

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
  headerContainer: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4 },
  totalText: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  addButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
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
  cardHeader: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 8 },
  description: { fontSize: 16, fontWeight: '600', color: '#111827' },
  date: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailCol: { flex: 1 },
  label: { fontSize: 12, color: '#6B7280', textTransform: 'uppercase', marginBottom: 4 },
  categoryText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  amount: { fontSize: 16, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 32 },
  filtersContainer: { marginBottom: 24 },
  dateFilterRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  dateInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12 },
  dateLabel: { fontSize: 12, color: '#6B7280', marginRight: 6, fontWeight: '600' },
  dateInputText: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#111827' },
  categoryFilterList: { paddingBottom: 8 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E5E7EB', marginRight: 8 },
  categoryPillText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  categoryPillTextSelected: { color: '#fff' }
});
