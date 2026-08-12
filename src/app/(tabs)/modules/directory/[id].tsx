import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import axiosClient from '../../../../api/axiosClient';
import { AppAlertStatic } from '../../../../components/ui/AppAlert';
import { EmployeeFormModal } from '../../../../components/directory/EmployeeFormModal';

export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployee = async () => {
    try {
      const response = await axiosClient.get(`/Employees/${id}`);
      if (response.data.isSuccess) {
        setEmployee(response.data.data);
      }
    } catch (error) {
      console.error(error);
      AppAlertStatic.alert('Error', 'Failed to load employee details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEmployee();
    }
  }, [id]);

  const handleEditSubmit = async (payload: any) => {
    setSubmitting(true);
    try {
      const response = await axiosClient.put(`/Employees/${id}`, payload);
      if (response.data && response.data.isSuccess === false) {
        AppAlertStatic.alert('Error', response.data.message || 'Validation failed');
        setSubmitting(false);
        return;
      }
      AppAlertStatic.alert('Success', 'Employee updated successfully!');
      setModalVisible(false);
      fetchEmployee();
    } catch (err: any) {
      AppAlertStatic.alert('Error', err.response?.data?.message || err.message || 'Failed to update employee');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!employee) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Employee not found.</Text>
      </View>
    );
  }

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const Field = ({ label, value }: { label: string, value: string }) => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || '-'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerActionsRow}>
            <View style={{ width: 40 }} />
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}</Text>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{employee.firstName} {employee.lastName}</Text>
          <Text style={styles.designation}>{employee.designation} • {employee.department}</Text>
        </View>

        <Section title="Identity Parameters">
          <Field label="Employee Code" value={employee.employeeCode} />
          <Field label="Personal Email" value={employee.personalEmail} />
          <Field label="Phone" value={employee.phone} />
          <Field label="Aadhaar Number" value={employee.aadhaarNumber} />
          <Field label="PAN Card" value={employee.panCardNumber} />
        </Section>

        <Section title="Emergency Contact">
          <Field label="Name" value={employee.emergencyContact?.name} />
          <Field label="Relation" value={employee.emergencyContact?.relation} />
          <Field label="Phone" value={employee.emergencyContact?.phone} />
        </Section>

        <Section title="Compensation Details">
          <Field label="Gross Monthly Salary" value={`₹${employee.monthlyGrossSalary}`} />
          <Field label="Joining Date" value={employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : ''} />
        </Section>

        <Section title="Residential Address">
          <Field label="Line 1" value={employee.address?.addressLine1} />
          <Field label="Line 2" value={employee.address?.addressLine2} />
          <Field label="City" value={employee.address?.city} />
          <Field label="State" value={employee.address?.state} />
          <Field label="PIN Code" value={employee.address?.pinCode} />
        </Section>

        <Section title="Bank Routing Details">
          <Field label="Bank Name" value={employee.bankDetails?.bankName} />
          <Field label="Account Number" value={employee.bankDetails?.accountNumber} />
          <Field label="IFSC Code" value={employee.bankDetails?.ifscCode} />
        </Section>

        <Section title="Security Domain Status">
          <Field label="Corporate Email" value={employee.email} />
          <Field label="Has Portal Access" value={employee.canLogin || employee.hasLoginAccess ? "Yes" : "No"} />
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>

      <EmployeeFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleEditSubmit}
        initialData={employee}
        submitting={submitting}
      />
    </View>
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
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#1D4ED8',
    fontSize: 28,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  designation: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  editBtnText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 12,
  },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  }
});
