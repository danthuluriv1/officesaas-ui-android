import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, RefreshControl } from 'react-native';
import { AppText as Text } from '../../../../../components/AppText';
import { Stack as ExpoStack } from 'expo-router';
import { Theme } from '../../../../../theme';
import { PayrollService } from '../../../../../api/payrollService';
import { DropdownPicker } from '../../../../../components/ui/DropdownPicker';
import { AppAlertStatic } from '../../../../../components/ui/AppAlert';

export default function StructuresScreen() {
  const [structures, setStructures] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchData = async () => {
    try {
      const [structRes, empRes] = await Promise.all([
        PayrollService.getSalaryStructures(),
        PayrollService.getEmployees()
      ]);
      if (structRes.isSuccess) setStructures(structRes.data);
      if (empRes.isSuccess) setEmployees(empRes.data.items || empRes.data || []);
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

  const handleAssignSubmit = async () => {
    if (!selectedEmployeeId) {
      AppAlertStatic.alert('Error', 'Please select an employee');
      return;
    }
    setAssigning(true);
    try {
      const empRes = await PayrollService.getEmployee(selectedEmployeeId);
      if (!empRes.isSuccess) throw new Error('Failed to fetch employee details');
      
      const fullEmp = empRes.data;
      fullEmp.associatedSalaryStructureId = selectedStructureId;
      
      const updateRes = await PayrollService.updateEmployee(selectedEmployeeId, fullEmp);
      if (updateRes.isSuccess) {
        setEmployees(prev => prev.map(e => e.entityId === selectedEmployeeId ? { ...e, associatedSalaryStructureId: selectedStructureId } : e));
        AppAlertStatic.alert('Success', 'Employee successfully assigned to structure!');
        setAssignModalVisible(false);
        setSelectedEmployeeId('');
      } else {
        throw new Error(updateRes.message || 'Failed to assign');
      }
    } catch (err: any) {
      AppAlertStatic.alert('Error', err.message || 'Failed to assign structure');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <View style={styles.container}>
      <ExpoStack.Screen options={{ title: 'Salary Structures' }} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerInfoText}>
            Note: In the mobile app, you can view existing Salary Structure templates. 
            Modifying employee base salaries must be done via the Web Application.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Available Structures</Text>
        {loading ? (
          <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 20 }} />
        ) : structures.length === 0 ? (
          <Text style={styles.emptyText}>No structures found.</Text>
        ) : (
          structures.map((s, i) => (
            <View key={i} style={styles.structureCard}>
              <Text style={styles.structureName}>{s.name}</Text>
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>Basic</Text>
                  <Text style={styles.breakdownValue}>{s.basicPercentage}%</Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>HRA</Text>
                  <Text style={styles.breakdownValue}>{s.hraPercentage}%</Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>Allowance</Text>
                  <Text style={styles.breakdownValue}>{s.allowancesPercentage}%</Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>PF</Text>
                  <Text style={styles.breakdownValue}>{s.providentFundPercentage || 0}%</Text>
                </View>
              </View>
              <View style={styles.secondaryRow}>
                <View style={styles.secondaryItem}>
                  <Text style={styles.secondaryLabel}>Work Days</Text>
                  <Text style={styles.secondaryValue}>{s.workingDaysPerWeek} days/week</Text>
                </View>
                <View style={styles.secondaryItem}>
                  <Text style={styles.secondaryLabel}>Overtime Pay</Text>
                  <Text style={styles.secondaryValue}>{s.overtimePayPercentage}% of base</Text>
                </View>
              </View>
              <View style={styles.assignedSection}>
                <Text style={styles.assignedTitle}>Assigned Employees</Text>
                {(() => {
                  const assigned = employees.filter(e => e.associatedSalaryStructureId === s.entityId);
                  if (assigned.length === 0) return <Text style={styles.assignedEmpty}>None</Text>;
                  return (
                    <View style={styles.assignedList}>
                      {assigned.map(emp => (
                        <View key={emp.entityId} style={styles.assignedBadge}>
                          <Text style={styles.assignedBadgeText}>{emp.firstName} {emp.lastName}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })()}
              </View>
              <TouchableOpacity 
                style={styles.assignBtn}
                onPress={() => {
                  setSelectedStructureId(s.entityId);
                  setAssignModalVisible(true);
                }}
              >
                <Text style={styles.assignBtnText}>Assign Employees</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={assignModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Structure</Text>
            <Text style={styles.modalSubtitle}>Select an employee to assign them to this salary structure.</Text>
            
            <DropdownPicker
              label="Select Employee"
              options={employees.map(e => ({ label: `${e.firstName} ${e.lastName} (${e.employeeCode})`, value: e.entityId }))}
              selectedValue={selectedEmployeeId}
              onSelect={(val) => setSelectedEmployeeId(val as string)}
              searchable
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setAssignModalVisible(false)} disabled={assigning}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleAssignSubmit} disabled={assigning}>
                {assigning ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSaveText}>Assign</Text>}
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
  scrollContent: {
    padding: 16,
  },
  headerInfo: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 20,
  },
  headerInfoText: {
    color: '#1E3A8A',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 12,
  },
  structureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  structureName: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownItem: {
    alignItems: 'center',
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  secondaryItem: {
    flex: 1,
  },
  secondaryLabel: {
    fontSize: 11,
    color: Theme.colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  secondaryValue: {
    fontSize: 13,
    fontWeight: '500',
    color: Theme.colors.textPrimary,
  },
  emptyText: {
    textAlign: 'center',
    color: Theme.colors.textTertiary,
    marginTop: 20,
  },
  assignBtn: {
    marginTop: 16,
    backgroundColor: '#EBF5FF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  assignBtnText: {
    color: Theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  assignedSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  assignedTitle: {
    fontSize: 11,
    color: Theme.colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  assignedEmpty: {
    fontSize: 13,
    color: Theme.colors.textTertiary,
    fontStyle: 'italic',
  },
  assignedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  assignedBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  assignedBadgeText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
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
