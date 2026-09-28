import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, RefreshControl } from 'react-native';
import { AppText as Text } from '../../../../../../components/AppText';
import { Stack as ExpoStack, useLocalSearchParams } from 'expo-router';
import { Theme } from '../../../../../../theme';
import { PayrollService } from '../../../../../../api/payrollService';
import { AppAlertStatic } from '../../../../../../components/ui/AppAlert';
import { DropdownPicker } from '../../../../../../components/ui/DropdownPicker';

export default function BatchDetailsScreen() {
  const { monthKey } = useLocalSearchParams<{ monthKey: string }>();
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState<any>(null);

  // Payslip features state
  const [selectedPayslips, setSelectedPayslips] = useState<string[]>([]);
  const [updatingPayslips, setUpdatingPayslips] = useState(false);

  // Disburse Entire Batch State
  const [disburseModalVisible, setDisburseModalVisible] = useState(false);
  const [disbursing, setDisbursing] = useState(false);
  const [mode, setMode] = useState('1'); // 1 = BankTransfer
  const [reference, setReference] = useState('');

  // Edit Advance State
  const [editAdvanceModalVisible, setEditAdvanceModalVisible] = useState(false);
  const [editingPayslipId, setEditingPayslipId] = useState('');
  const [advanceAmountInput, setAdvanceAmountInput] = useState('');
  
  const [refreshing, setRefreshing] = useState(false);

  const fetchBatch = async () => {
    try {
      const res = await PayrollService.getPayrollHistory(monthKey!);
      if (res.isSuccess) {
        setBatch(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch batch details', err);
    }
  };

  useEffect(() => {
    if (monthKey) {
      fetchBatch().finally(() => setLoading(false));
    }
  }, [monthKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBatch();
    setRefreshing(false);
  };

  const handleDisburse = async () => {
    setDisbursing(true);
    try {
      const res = await PayrollService.disburseBatch(batch.entityId || batch.id, mode, reference);
      if (res.isSuccess) {
        AppAlertStatic.alert('Success', 'Payroll batch successfully disbursed!');
        setDisburseModalVisible(false);
        fetchBatch();
      } else {
        throw new Error(res.message || 'Failed to disburse');
      }
    } catch (err: any) {
      AppAlertStatic.alert('Error', err.message || 'Failed to disburse batch');
    } finally {
      setDisbursing(false);
    }
  };

  const toggleSelectPayslip = (id: string) => {
    setSelectedPayslips(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleMarkPaid = async () => {
    if (selectedPayslips.length === 0) return;
    setUpdatingPayslips(true);
    try {
      const res = await PayrollService.markPayslipsPaid(selectedPayslips);
      if (res.isSuccess) {
        AppAlertStatic.alert('Success', 'Selected payslips marked as paid.');
        setSelectedPayslips([]);
        fetchBatch();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      AppAlertStatic.alert('Error', err.message || 'Failed to mark paid');
    } finally {
      setUpdatingPayslips(false);
    }
  };

  const handleSaveAdvance = async () => {
    if (!editingPayslipId) return;
    setUpdatingPayslips(true);
    try {
      const res = await PayrollService.updateAdvanceDeduction(editingPayslipId, parseFloat(advanceAmountInput || '0'));
      if (res.isSuccess) {
        setEditAdvanceModalVisible(false);
        fetchBatch();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      AppAlertStatic.alert('Error', err.message || 'Failed to update advance');
    } finally {
      setUpdatingPayslips(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ExpoStack.Screen options={{ title: 'Batch Details' }} />
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  if (!batch) {
    return (
      <View style={styles.center}>
        <ExpoStack.Screen options={{ title: 'Batch Details' }} />
        <Text style={{ color: Theme.colors.textSecondary }}>Batch not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ExpoStack.Screen options={{ title: `Batch ${batch.batchNumber || monthKey}` }} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        <View style={styles.projectionContainer}>
          <Text style={styles.sectionTitle}>Summary</Text>
          
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }]}>
              <Text style={styles.summaryLabel}>Total Gross</Text>
              <Text style={styles.summaryValue}>₹{batch.totalGrossPayout?.toLocaleString('en-IN') || 0}</Text>
            </View>
            <View style={[styles.summaryCard, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
              <Text style={[styles.summaryLabel, { color: '#DC2626' }]}>Deductions</Text>
              <Text style={[styles.summaryValue, { color: '#DC2626' }]}>₹{batch.totalDeductions?.toLocaleString('en-IN') || 0}</Text>
            </View>
            <View style={[styles.summaryCard, { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5', width: '100%' }]}>
              <Text style={[styles.summaryLabel, { color: '#059669' }]}>Total Net Payable</Text>
              <Text style={[styles.summaryValue, { color: '#059669', fontSize: 24 }]}>₹{batch.totalNetPayout?.toLocaleString('en-IN') || 0}</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Employee Breakdown</Text>
          {batch.payslips?.length > 0 ? batch.payslips.map((slip: any, i: number) => {
            const isSelected = selectedPayslips.includes(slip.entityId || slip.id);
            return (
              <View key={i} style={[styles.employeeCard, isSelected && { borderColor: Theme.colors.primary, borderWidth: 2 }]}>
                <TouchableOpacity 
                  style={styles.empHeader}
                  onPress={() => !slip.isPaid && toggleSelectPayslip(slip.entityId || slip.id)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={styles.empName}>{slip.employeeNameSnapshot}</Text>
                    <Text style={styles.empCode}>{slip.employeeCodeSnapshot}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {slip.isPaid ? (
                      <View style={[styles.badge, styles.badgeSuccess]}><Text style={styles.badgeSuccessText}>Paid</Text></View>
                    ) : (
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                <View style={styles.empDetails}>
                  <Text style={styles.empDetailText}>Present: <Text style={{ color: '#059669' }}>{slip.daysPresent}</Text></Text>
                  <Text style={styles.empDetailText}>LOP: <Text style={{ color: '#DC2626' }}>{slip.daysAbsent}</Text></Text>
                  
                  <TouchableOpacity 
                    onPress={() => {
                      if (slip.isPaid) return;
                      setEditingPayslipId(slip.entityId || slip.id);
                      setAdvanceAmountInput(slip.advanceDeduction?.toString() || '0');
                      setEditAdvanceModalVisible(true);
                    }}
                    style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 6, borderRadius: 4 }}
                  >
                    <Text style={styles.empDetailText}>Adv: ₹{slip.advanceDeduction || 0} ✎</Text>
                  </TouchableOpacity>

                  <Text style={styles.empDetailText}>Net: <Text style={{ fontWeight: '700' }}>₹{slip.netSalaryPayable?.toLocaleString('en-IN')}</Text></Text>
                </View>
              </View>
            );
          }) : (
            <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 12 }}>No payslips found in this batch.</Text>
          )}

          {selectedPayslips.length > 0 ? (
            <TouchableOpacity 
              style={[styles.disburseBtn, { backgroundColor: '#059669' }]} 
              onPress={handleMarkPaid}
              disabled={updatingPayslips}
            >
              {updatingPayslips ? <ActivityIndicator color="#fff" /> : <Text style={styles.disburseBtnText}>Mark Selected ({selectedPayslips.length}) as Paid</Text>}
            </TouchableOpacity>
          ) : (
            (batch.status === 0 || batch.status === 1 || batch.status === 'Draft' || batch.status === 'Approved') && (
              <TouchableOpacity 
                style={styles.disburseBtn} 
                onPress={() => setDisburseModalVisible(true)}
              >
                <Text style={styles.disburseBtnText}>Disburse Entire Batch</Text>
              </TouchableOpacity>
            )
          )}

        </View>
      </ScrollView>

      <Modal visible={disburseModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Disburse Payroll</Text>
            <Text style={styles.modalSubtitle}>
              Disbursing this batch will finalize the payslips and record them against the employees' ledgers.
            </Text>
            
            <DropdownPicker
              label="Payment Mode"
              options={[
                { label: 'Cash', value: '0' },
                { label: 'Bank Transfer', value: '1' },
                { label: 'UPI', value: '2' },
                { label: 'Cheque', value: '3' }
              ]}
              selectedValue={mode}
              onSelect={(val) => setMode(val as string)}
            />

            {mode !== '0' && (
              <>
                <Text style={styles.inputLabel}>Transaction Reference</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. TXN12345678"
                  value={reference}
                  onChangeText={setReference}
                />
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setDisburseModalVisible(false)} disabled={disbursing}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleDisburse} disabled={disbursing}>
                {disbursing ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSaveText}>Disburse</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editAdvanceModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Advance Deduction</Text>
            <Text style={styles.modalSubtitle}>
              Adjust the amount of salary advance to deduct from this payslip.
            </Text>
            
            <Text style={styles.inputLabel}>Advance Deduction Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="numeric"
              value={advanceAmountInput}
              onChangeText={setAdvanceAmountInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditAdvanceModalVisible(false)} disabled={updatingPayslips}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveAdvance} disabled={updatingPayslips}>
                {updatingPayslips ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSaveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  projectionContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A8A',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  employeeCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  empHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
  },
  empName: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  empCode: {
    fontSize: 12,
    color: Theme.colors.textTertiary,
  },
  empDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  empDetailText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  badgeSuccessText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  disburseBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  disburseBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
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
