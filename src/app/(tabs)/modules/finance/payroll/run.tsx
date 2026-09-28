import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { AppText as Text } from '../../../../../components/AppText';
import { Stack as ExpoStack, useRouter } from 'expo-router';
import { Theme } from '../../../../../theme';
import { PayrollService } from '../../../../../api/payrollService';
import { AppAlertStatic } from '../../../../../components/ui/AppAlert';
import { Ionicons } from '@expo/vector-icons';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function RunPayrollScreen() {
  const router = useRouter();
  
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [projection, setProjection] = useState<any>(null);

  const monthKey = `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}`;
  const displayLabel = `${MONTHS[selectedMonthIndex]} ${selectedYear}`;

  const handlePreview = async () => {
    if (!monthKey) {
      AppAlertStatic.alert('Validation', 'Please enter a month (YYYY-MM)');
      return;
    }
    setLoading(true);
    try {
      const res = await PayrollService.previewPayroll(monthKey);
      if (res.isSuccess) {
        setProjection(res.data);
      } else {
        AppAlertStatic.alert('Error', res.message || 'Failed to generate projection');
      }
    } catch (err: any) {
      AppAlertStatic.alert('Error', err.message || 'Failed to generate projection');
    } finally {
      setLoading(false);
    }
  };

  const handleRunPayroll = async () => {
    AppAlertStatic.alert('Run Payroll', `Are you sure you want to finalize payroll for ${displayLabel}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Run Payroll', 
        onPress: async () => {
          setRunning(true);
          try {
            const res = await PayrollService.finalizePayroll(monthKey);
            if (res.isSuccess) {
              AppAlertStatic.alert('Success', `Payroll finalized (Batch: ${res.data.batchNumber})`);
              router.back();
            } else {
              AppAlertStatic.alert('Error', res.message || 'Failed to run payroll');
            }
          } catch (err: any) {
            AppAlertStatic.alert('Error', err.message || 'Failed to run payroll');
          } finally {
            setRunning(false);
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <ExpoStack.Screen options={{ title: 'Run Payroll' }} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.inputSection}>
          <Text style={styles.label}>Select Payroll Month</Text>
          <TouchableOpacity style={styles.pickerTrigger} onPress={() => { setPickerYear(selectedYear); setShowPicker(true); }}>
            <Ionicons name="calendar-outline" size={20} color="#4B5563" />
            <Text style={styles.pickerTriggerText}>{displayLabel}</Text>
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.previewBtn, { marginTop: 12 }]} onPress={handlePreview} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.previewBtnText}>Project Payroll for {displayLabel}</Text>}
          </TouchableOpacity>
        </View>

        <Modal visible={showPicker} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setPickerYear(p => p - 1)} style={styles.yearBtn}>
                  <Ionicons name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.modalYearText}>{pickerYear}</Text>
                <TouchableOpacity onPress={() => setPickerYear(p => p + 1)} style={styles.yearBtn}>
                  <Ionicons name="chevron-forward" size={24} color="#111827" />
                </TouchableOpacity>
              </View>
              <View style={styles.monthsGrid}>
                {MONTHS.map((m, idx) => {
                  const isSelected = selectedYear === pickerYear && selectedMonthIndex === idx;
                  return (
                    <TouchableOpacity 
                      key={m} 
                      style={[styles.monthCell, isSelected && styles.monthCellSelected]}
                      onPress={() => {
                        setSelectedYear(pickerYear);
                        setSelectedMonthIndex(idx);
                        setShowPicker(false);
                      }}
                    >
                      <Text style={[styles.monthCellText, isSelected && styles.monthCellTextSelected]}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowPicker(false)}>
                <Text style={styles.modalCloseBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {projection && (
          <View style={styles.projectionContainer}>
            <Text style={styles.sectionTitle}>Summary</Text>
            
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }]}>
                <Text style={styles.summaryLabel}>Total Gross</Text>
                <Text style={styles.summaryValue}>₹{projection.totalGrossPayout?.toLocaleString('en-IN') || 0}</Text>
              </View>
              <View style={[styles.summaryCard, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
                <Text style={[styles.summaryLabel, { color: '#DC2626' }]}>Deductions</Text>
                <Text style={[styles.summaryValue, { color: '#DC2626' }]}>₹{projection.totalDeductions?.toLocaleString('en-IN') || 0}</Text>
              </View>
              <View style={[styles.summaryCard, { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5', width: '100%' }]}>
                <Text style={[styles.summaryLabel, { color: '#059669' }]}>Total Net Payable</Text>
                <Text style={[styles.summaryValue, { color: '#059669', fontSize: 24 }]}>₹{projection.totalNetPayout?.toLocaleString('en-IN') || 0}</Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Employee Breakdown</Text>
            {projection.payslips?.map((slip: any, i: number) => (
              <View key={i} style={styles.employeeCard}>
                <View style={styles.empHeader}>
                  <Text style={styles.empName}>{slip.employeeNameSnapshot}</Text>
                  <Text style={styles.empCode}>{slip.employeeCodeSnapshot}</Text>
                </View>
                <View style={styles.empDetails}>
                  <Text style={styles.empDetailText}>Present: <Text style={{ color: '#059669' }}>{slip.daysPresent}</Text></Text>
                  <Text style={styles.empDetailText}>LOP: <Text style={{ color: '#DC2626' }}>{slip.daysAbsent}</Text></Text>
                  <Text style={styles.empDetailText}>Net: <Text style={{ fontWeight: '700' }}>₹{slip.netSalaryPayable?.toLocaleString('en-IN')}</Text></Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {projection && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.runBtn} onPress={handleRunPayroll} disabled={running}>
            {running ? <ActivityIndicator color="#fff" /> : <Text style={styles.runBtnText}>Finalize & Run Payroll</Text>}
          </TouchableOpacity>
        </View>
      )}
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
    paddingBottom: 40,
  },
  inputSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Theme.colors.borderDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: Theme.colors.surface,
  },
  previewBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  previewBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
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
  },
  empDetailText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  runBtn: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  runBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.borderDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Theme.colors.surface,
  },
  pickerTriggerText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  yearBtn: {
    padding: 8,
  },
  modalYearText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  monthCell: {
    width: '31%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  monthCellSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  monthCellText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  monthCellTextSelected: {
    color: '#fff',
  },
  modalCloseBtn: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCloseBtnText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 16,
  },
});
