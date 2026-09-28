import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { AppText as Text } from '../../../../../components/AppText';
import { useRouter } from 'expo-router';
import { Stack as ExpoStack } from 'expo-router';
import { Theme } from '../../../../../theme';
import { PayrollService } from '../../../../../api/payrollService';
import { Ionicons } from '@expo/vector-icons';

export default function PayrollDashboard() {
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBatches = async () => {
    try {
      const res = await PayrollService.getPayrollBatches();
      if (res.isSuccess) {
        setBatches(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch batches', err);
    }
  };

  useEffect(() => {
    fetchBatches().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBatches();
    setRefreshing(false);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ExpoStack.Screen options={{ title: 'Payroll & Compensation' }} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payroll Hub</Text>
        <Text style={styles.headerSubtitle}>Manage salaries, advances, and monthly runs.</Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/modules/finance/payroll/run')}>
          <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="calculator" size={24} color="#059669" />
          </View>
          <Text style={styles.actionText}>Run Payroll</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/modules/finance/payroll/structures')}>
          <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="options" size={24} color="#D97706" />
          </View>
          <Text style={styles.actionText}>Structures</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/modules/finance/payroll/advances')}>
          <View style={[styles.actionIcon, { backgroundColor: '#E0E7FF' }]}>
            <Ionicons name="cash-outline" size={24} color="#4F46E5" />
          </View>
          <Text style={styles.actionText}>Advances</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>Recent Batches</Text>
        {loading ? (
          <ActivityIndicator size="small" color={Theme.colors.primary} style={{ marginTop: 20 }} />
        ) : batches.length === 0 ? (
          <Text style={styles.emptyText}>No payroll batches found.</Text>
        ) : (
          batches.map((batch: any, i: number) => (
            <TouchableOpacity 
              key={i} 
              style={styles.historyCard}
              onPress={() => router.push(`/(tabs)/modules/finance/payroll/batch/${batch.monthKey}`)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.batchTitle}>Batch {batch.batchNumber || 'N/A'}</Text>
                <Text style={styles.batchDate}>{batch.monthKey || 'Unknown Month'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.batchAmount}>₹{batch.totalGrossPayout?.toLocaleString('en-IN') || 0}</Text>
                <Text style={styles.batchStatus}>
                  {batch.status === 2 || batch.status === 'Disbursed' ? 'Disbursed' 
                    : batch.status === 1 || batch.status === 'Approved' ? 'Approved' 
                    : 'Draft'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  actionsContainer: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
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
    fontSize: 20,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  historyContainer: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  batchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  batchDate: {
    fontSize: 13,
    color: Theme.colors.textTertiary,
    marginTop: 2,
  },
  batchAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  batchStatus: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  emptyText: {
    textAlign: 'center',
    color: Theme.colors.textTertiary,
    marginTop: 20,
  }
});






