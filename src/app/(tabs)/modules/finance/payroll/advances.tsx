import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Modal, RefreshControl } from 'react-native';
import { AppText as Text } from '../../../../../components/AppText';
import { Stack as ExpoStack } from 'expo-router';
import { Theme } from '../../../../../theme';
import { PayrollService } from '../../../../../api/payrollService';
import { Ionicons } from '@expo/vector-icons';
import { DropdownPicker } from '../../../../../components/ui/DropdownPicker';
import { AppAlertStatic } from '../../../../../components/ui/AppAlert';

export default function AdvancesScreen() {
  const [advances, setAdvances] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form State
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [targetEntityId, setTargetEntityId] = useState('');
  const [amount, setAmount] = useState('');
  const [disbursedMode, setDisbursedMode] = useState('NetBanking');
  const [bankReference, setBankReference] = useState('');
  const [remarks, setRemarks] = useState('');

  const fetchData = async () => {
    try {
      const [advRes, empRes] = await Promise.all([
        PayrollService.getAdvances(),
        PayrollService.getEmployees()
      ]);
      if (advRes.isSuccess) setAdvances(advRes.data?.items || advRes.data || []);
      if (empRes.isSuccess) setEmployees(empRes.data?.items || empRes.data || []);
    } catch (err) {
      console.warn('Failed to fetch data', err);
    }
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleRecordAdvance = async () => {
    if (!targetEntityId || !amount) {
      AppAlertStatic.alert('Error', 'Employee and amount are required.');
      return;
    }
    setSubmitting(true);
    try {
      const emp = employees.find(e => e.entityId === targetEntityId);
      const payload = {
        partyType: 'Employee',
        targetEntityId,
        partyNameSnapshot: emp ? `${emp.firstName} ${emp.lastName}` : '',
        totalAmountGiven: parseFloat(amount),
        disbursedDate: new Date().toISOString(),
        disbursedMode,
        bankReference,
        remarks
      };
      const res = await PayrollService.createAdvance(payload);
      if (res.isSuccess) {
        AppAlertStatic.alert('Success', 'Advance successfully recorded.');
        setRecordModalVisible(false);
        setTargetEntityId('');
        setAmount('');
        setBankReference('');
        setRemarks('');
        fetchData();
      } else {
        throw new Error(res.message || 'Failed to record advance');
      }
    } catch (err: any) {
      AppAlertStatic.alert('Error', err.message || 'Failed to record advance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ExpoStack.Screen options={{ title: 'Employee Advances' }} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerInfoText}>
            Issue salary advances to employees. Advances are automatically deducted during the next payroll run.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Recent Advances</Text>
        {loading ? (
          <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 20 }} />
        ) : advances.length === 0 ? (
          <Text style={styles.emptyText}>No advances recorded.</Text>
        ) : (
          advances.map((adv, i) => {
            const isSettled = adv.status === 'Settled' || adv.status === 1; // Depending on enum serialization
            return (
              <View key={i} style={styles.advanceCard}>
                <View style={styles.advHeader}>
                  <Text style={styles.empName}>{adv.partyNameSnapshot}</Text>
                  <Text style={styles.date}>{adv.disbursedDate ? new Date(adv.disbursedDate).toLocaleDateString() : ''}</Text>
                </View>
                <View style={styles.advFooter}>
                  <View>
                    <Text style={styles.amountLabel}>Balance</Text>
                    <Text style={styles.amount}>₹{adv.remainingBalance?.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.amountGivenText}>Given: ₹{adv.totalAmountGiven?.toLocaleString('en-IN')}</Text>
                    <View style={[styles.badge, isSettled ? styles.badgeSuccess : styles.badgePending]}>
                      <Text style={[styles.badgeText, isSettled ? styles.badgeSuccessText : styles.badgePendingText]}>
                        {adv.status === 1 || adv.status === 'FullySettled' || adv.status === 'Settled' ? 'Settled' : 
                         adv.status === 0 || adv.status === 'Active' ? 'Active' : (adv.status || 'Pending')}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setRecordModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>Record Advance</Text>
      </TouchableOpacity>

      <Modal visible={recordModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Record Advance</Text>
              
              <DropdownPicker
                label="Select Employee"
                options={employees.map(e => ({ label: `${e.firstName} ${e.lastName} (${e.employeeCode})`, value: e.entityId }))}
                selectedValue={targetEntityId}
                onSelect={(val) => setTargetEntityId(val as string)}
                searchable
              />

              <Text style={styles.inputLabel}>Amount (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <DropdownPicker
                label="Payment Mode"
                options={[
                  { label: 'NetBanking', value: 'NetBanking' },
                  { label: 'Cash', value: 'Cash' },
                  { label: 'UPI', value: 'UPI' },
                  { label: 'Cheque', value: 'Cheque' }
                ]}
                selectedValue={disbursedMode}
                onSelect={(val) => setDisbursedMode(val as string)}
              />

              {disbursedMode !== 'Cash' && (
                <>
                  <Text style={styles.inputLabel}>Transaction Ref / Cheque No</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. TXN123456"
                    value={bankReference}
                    onChangeText={setBankReference}
                  />
                </>
              )}

              <Text style={styles.inputLabel}>Remarks (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Medical emergency"
                value={remarks}
                onChangeText={setRemarks}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setRecordModalVisible(false)} disabled={submitting}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={handleRecordAdvance} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSaveText}>Save</Text>}
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  headerInfo: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  headerInfoText: {
    color: '#92400E',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 12,
  },
  advanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  advHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  empName: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  date: {
    fontSize: 12,
    color: Theme.colors.textTertiary,
  },
  advFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  amountGivenText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgePendingText: {
    color: '#D97706',
  },
  badgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  badgeSuccessText: {
    color: '#059669',
  },
  emptyText: {
    textAlign: 'center',
    color: Theme.colors.textTertiary,
    marginTop: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 100,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 16,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  modalSave: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
