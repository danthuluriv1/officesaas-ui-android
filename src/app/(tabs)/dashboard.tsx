import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Platform, Modal, RefreshControl } from 'react-native';
import { AppText as Text } from '../../components/AppText';
import { useRouter, useFocusEffect, Href } from 'expo-router';
import axiosClient from '../../api/axiosClient';
import { LineChart } from 'react-native-chart-kit';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ShortcutConfig {
  id: string;
  title: string;
  icon: string;
  bgColor: string;
  route: string;
  params?: any;
  showBadge?: boolean;
}

const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  { id: 'inbox', title: 'Inbox', icon: '📥', bgColor: '#DBEAFE', route: '/(tabs)/modules/inbox', showBadge: true },
  { id: 'workspace', title: 'Workspace', icon: '📋', bgColor: '#F3E8FF', route: '/(tabs)/modules/workspace' },
  { id: 'addExpense', title: 'Add Expense', icon: '💸', bgColor: '#FEE2E2', route: '/(tabs)/modules/finance', params: { action: 'addExpense' } },
  { id: 'postPayment', title: 'Post Payment', icon: '💳', bgColor: '#D1FAE5', route: '/(tabs)/modules/finance', params: { action: 'addPayment' } },
  { id: 'attendance', title: 'Attendance', icon: '⏱️', bgColor: '#E0F2FE', route: '/(tabs)/modules/attendance' },
  { id: 'directory', title: 'Directory', icon: '👥', bgColor: '#D1FAE5', route: '/(tabs)/modules/directory' },
];

interface ChartDataItem {
  date: string;
  revenue?: number;
  expense?: number;
  profit?: number;
}

interface DashboardStats {
  totalExpenses: number;
  totalPaymentsReceived: number;
  chartData: ChartDataItem[];
}

interface UnreadCountResponse {
  totalCount?: number;
  count?: number;
}

export default function DashboardScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>(DEFAULT_SHORTCUTS);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [editingShortcuts, setEditingShortcuts] = useState<ShortcutConfig[]>([]);

  // Dynamic Chart Width
  const [chartWidth, setChartWidth] = useState(0);

  // Load saved shortcut order on mount
  useEffect(() => {
    loadShortcutOrder();
  }, []);

  const loadShortcutOrder = async () => {
    try {
      const saved = await AsyncStorage.getItem('dashboard_shortcuts_order');
      if (saved) {
        const orderIds: string[] = JSON.parse(saved);
        const ordered = orderIds
          .map(id => DEFAULT_SHORTCUTS.find(s => s.id === id))
          .filter(Boolean) as ShortcutConfig[];

        DEFAULT_SHORTCUTS.forEach(s => {
          if (!ordered.some(o => o.id === s.id)) {
            ordered.push(s);
          }
        });
        setShortcuts(ordered);
      }
    } catch (e) {
      console.warn("Failed to load shortcuts order", e);
    }
  };

  const handleOpenCustomize = () => {
    setEditingShortcuts([...shortcuts]);
    setIsCustomizeOpen(true);
  };

  const moveShortcut = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= editingShortcuts.length) return;

    const updated = [...editingShortcuts];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setEditingShortcuts(updated);
  };

  const handleSaveShortcuts = async () => {
    setShortcuts(editingShortcuts);
    setIsCustomizeOpen(false);
    try {
      await AsyncStorage.setItem('dashboard_shortcuts_order', JSON.stringify(editingShortcuts.map(s => s.id)));
    } catch (e) {
      console.warn("Failed to save shortcuts order", e);
    }
  };
  
  // Date State
  const today = new Date();
  const quarter = Math.floor(today.getMonth() / 3);
  const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
  const endOfQuarter = new Date(startOfQuarter.getFullYear(), startOfQuarter.getMonth() + 3, 0);

  const [startDate, setStartDate] = useState(startOfQuarter.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(endOfQuarter.toISOString().split('T')[0]);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const onChangeStart = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowStartPicker(false);
    if (selectedDate) setStartDate(selectedDate.toISOString().split('T')[0]);
  };

  const onChangeEnd = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowEndPicker(false);
    if (selectedDate) setEndDate(selectedDate.toISOString().split('T')[0]);
  };

  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
      fetchStats();
    }, [startDate, endDate])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUnreadCount(),
      fetchStats()
    ]);
    setRefreshing(false);
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axiosClient.get<any>('/Messages/unread-count');
      if (response.data) {
        const payload = response.data.data !== undefined ? response.data.data : response.data;
        const count = typeof payload === 'number' ? payload : (payload?.totalCount || payload?.count || 0);
        setUnreadCount(count);
      }
    } catch (e) {
      console.warn("Failed to fetch unread count", e);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const toISTStartUTC = (dateStr: string) => new Date(`${dateStr}T00:00:00+05:30`).toISOString();
      const toISTEndUTC = (dateStr: string) => new Date(`${dateStr}T23:59:59.999+05:30`).toISOString();

      const response = await axiosClient.get<any>('/Financials/dashboard', {
        params: { 
          startDate: toISTStartUTC(startDate), 
          endDate: toISTEndUTC(endDate) 
        }
      });

      const payload = response.data?.data ?? response.data;
      if (payload && Array.isArray(payload.chartData)) {
        setStats(payload);
      } else {
        setStats(null);
      }
    } catch (err) {
      console.warn("Failed to fetch finance stats", err);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.maxWidthWrapper}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Here is your quick access dashboard.</Text>

          <View style={styles.dateFilterRow}>
            <TouchableOpacity style={styles.dateInputWrapper} onPress={() => setShowStartPicker(true)}>
              <Text style={styles.dateLabel}>From:</Text>
              <Text style={styles.dateInputText}>{startDate}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateInputWrapper} onPress={() => setShowEndPicker(true)}>
              <Text style={styles.dateLabel}>To:</Text>
              <Text style={styles.dateInputText}>{endDate}</Text>
            </TouchableOpacity>
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={new Date(startDate)}
              mode="date"
              display="default"
              onValueChange={onChangeStart}
              onDismiss={() => setShowStartPicker(false)}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={new Date(endDate)}
              mode="date"
              display="default"
              onValueChange={onChangeEnd}
              onDismiss={() => setShowEndPicker(false)}
            />
          )}

          <View 
            style={styles.chartContainer} 
            onLayout={(e) => setChartWidth(e.nativeEvent.layout.width - 32)} // 32 is padding
          >
            <Text style={styles.sectionTitle}>Profitability Trends</Text>
            {loading ? (
              <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6366f1" />
              </View>
            ) : stats && stats.chartData && stats.chartData.length > 0 ? (
              <>
                <View style={styles.legendContainer}>
                   <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#10b981' }]} /><Text style={styles.legendText}>Revenue</Text></View>
                   <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} /><Text style={styles.legendText}>Expense</Text></View>
                   <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#6366f1' }]} /><Text style={styles.legendText}>Profit</Text></View>
                </View>
                {chartWidth > 0 && (
                  <LineChart
                    data={{
                      labels: stats.chartData.map(d => {
                      if (!d.date) return '';
                      const parsedDate = new Date(d.date);
                      if (!isNaN(parsedDate.getTime())) {
                        return `${parsedDate.getDate()}/${parsedDate.getMonth() + 1}`;
                      }
                      return d.date;
                    }),
                      datasets: [
                        {
                          data: stats.chartData.map(d => d.revenue || 0),
                          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                          strokeWidth: 2
                        },
                        {
                          data: stats.chartData.map(d => d.expense || 0),
                          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                          strokeWidth: 2
                        },
                        {
                          data: stats.chartData.map(d => d.profit || 0),
                          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                          strokeWidth: 2
                        }
                      ]
                    }}
                    width={chartWidth}
                    height={220}
                    yAxisLabel="₹"
                    yAxisSuffix=""
                    yAxisInterval={1}
                    withShadow={false}
                    chartConfig={{
                      backgroundColor: '#fff',
                      backgroundGradientFrom: '#fff',
                      backgroundGradientTo: '#fff',
                      decimalPlaces: 0, 
                      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                      style: {
                        borderRadius: 16
                      },
                      propsForDots: {
                        r: '3',
                        strokeWidth: '1',
                        stroke: '#fff'
                      }
                    }}
                    bezier
                    style={{
                      marginVertical: 8,
                      borderRadius: 16,
                    }}
                    formatYLabel={(y) => {
                      const num = parseFloat(y);
                      if (num >= 1000 || num <= -1000) {
                        return (num / 1000).toFixed(1) + 'k';
                      }
                      return num.toString();
                    }}
                  />
                )}
              </>
            ) : (
              <View style={{ height: 120, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#9CA3AF', fontSize: 14 }}>No data found for selected period.</Text>
              </View>
            )}
          </View>

          <View style={styles.shortcutsContainer}>
            <View style={styles.shortcutsHeaderRow}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Quick Shortcuts</Text>
              <TouchableOpacity onPress={handleOpenCustomize} style={styles.reorderBtn}>
                <Text style={styles.reorderBtnText}>⚙️ Reorder</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionsRow}>
              {shortcuts.map(item => (
                <TouchableOpacity 
                  key={item.id}
                  style={styles.actionCard} 
                  onPress={() => router.push(item.params ? { pathname: item.route, params: item.params } as Href : item.route as Href)}
                >
                  <View style={[styles.actionIcon, { backgroundColor: item.bgColor }]}>
                    <Text style={styles.iconText}>{item.icon}</Text>
                    {item.showBadge && unreadCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.actionText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Reorder Modal */}
        <Modal visible={isCustomizeOpen} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reorder Shortcuts</Text>
                <TouchableOpacity onPress={() => setIsCustomizeOpen(false)}>
                  <Text style={styles.closeText}>Cancel</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 350, marginVertical: 8 }}>
                {editingShortcuts.map((item, index) => (
                  <View key={item.id} style={styles.reorderRow}>
                    <View style={styles.reorderItemLeft}>
                      <View style={[styles.reorderIcon, { backgroundColor: item.bgColor }]}>
                        <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                      </View>
                      <Text style={styles.reorderItemTitle}>{item.title}</Text>
                    </View>
                    <View style={styles.reorderButtons}>
                      <TouchableOpacity
                        disabled={index === 0}
                        style={[styles.moveBtn, index === 0 && styles.moveBtnDisabled]}
                        onPress={() => moveShortcut(index, 'up')}
                      >
                        <Text style={[styles.moveBtnText, index === 0 && styles.moveBtnTextDisabled]}>▲</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        disabled={index === editingShortcuts.length - 1}
                        style={[styles.moveBtn, index === editingShortcuts.length - 1 && styles.moveBtnDisabled]}
                        onPress={() => moveShortcut(index, 'down')}
                      >
                        <Text style={[styles.moveBtnText, index === editingShortcuts.length - 1 && styles.moveBtnTextDisabled]}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.saveShortcutsBtn} onPress={handleSaveShortcuts}>
                <Text style={styles.saveShortcutsBtnText}>Save Arrangement</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    flexGrow: 1,
  },
  maxWidthWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    padding: 20,
    paddingTop: 24, // Let SafeAreaView handle top notch
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 20,
  },
  dateFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  dateInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 6,
    fontWeight: '600',
  },
  dateInputText: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  shortcutsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reorderBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  reorderBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  reorderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  reorderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reorderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  reorderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  moveBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moveBtnDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.4,
  },
  moveBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  moveBtnTextDisabled: {
    color: '#D1D5DB',
  },
  saveShortcutsBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveShortcutsBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  shortcutsContainer: {
    marginTop: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  actionCard: {
    flexGrow: 1,
    flexBasis: 150,
    minWidth: 150,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  iconText: {
    fontSize: 28,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});
