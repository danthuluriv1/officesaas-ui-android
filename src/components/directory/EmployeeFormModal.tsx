import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { Theme } from '../../theme';
import { View, Text, StyleSheet, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, ScrollView, Platform, Switch, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DropdownPicker } from '../ui/DropdownPicker';
import { AppAlertStatic } from '../ui/AppAlert';
import { PhoneNumberInput } from '../ui/PhoneNumberInput';
import axiosClient from '../../api/axiosClient';

export interface EmployeeFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
  initialData?: any; // null for onboard, employee object for edit
  submitting?: boolean;
}

export function EmployeeFormModal({ visible, onClose, onSubmit, initialData, submitting }: EmployeeFormModalProps) {
  // Settings Data
  const [departments, setDepartments] = useState<string[]>([]);
  const [designations, setDesignations] = useState<string[]>([]);
  const [companyDomain, setCompanyDomain] = useState<string>('company.com');

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');
  const [monthlyGrossSalary, setMonthlyGrossSalary] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().substring(0, 10));
  const [showJoiningDatePicker, setShowJoiningDatePicker] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panCardNumber, setPanCardNumber] = useState('');
  const [canLogin, setCanLogin] = useState(false);
  const [emailPrefix, setEmailPrefix] = useState('');
  const [role, setRole] = useState(0);

  // Address
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pinCode, setPinCode] = useState('');

  // Bank Details
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axiosClient.get('/Settings/profile');
        if (res.data?.isSuccess) {
          setDepartments(res.data.data.departments || []);
          setDesignations(res.data.data.designations || []);
          setCompanyDomain(res.data.data.companyDomain || 'company.com');
        }
      } catch (error) {
        console.warn('Failed to fetch settings', error);
      }
    };
    if (visible) {
      fetchSettings();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setFirstName(initialData.firstName || '');
        setLastName(initialData.lastName || '');
        setDepartment(initialData.department || '');
        setDesignation(initialData.designation || '');
        setPersonalEmail(initialData.personalEmail || '');
        setPhone(initialData.phone || '');
        setEmergencyContactName(initialData.emergencyContact?.name || '');
        setEmergencyContactPhone(initialData.emergencyContact?.phone || '');
        setEmergencyContactRelation(initialData.emergencyContact?.relation || '');
        setMonthlyGrossSalary(initialData.monthlyGrossSalary ? initialData.monthlyGrossSalary.toString() : '');
        setJoiningDate(initialData.joiningDate ? new Date(initialData.joiningDate).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10));
        setAadhaarNumber(initialData.aadhaarNumber || '');
        setPanCardNumber(initialData.panCardNumber || '');
        setCanLogin(initialData.canLogin || initialData.hasLoginAccess || false);
        
        if (initialData.email) {
          const parts = initialData.email.split('@');
          if (parts.length > 0) setEmailPrefix(parts[0]);
        } else {
          setEmailPrefix('');
        }
        setRole(initialData.role || 0);

        setAddressLine1(initialData.address?.addressLine1 || '');
        setAddressLine2(initialData.address?.addressLine2 || '');
        setCity(initialData.address?.city || '');
        setStateName(initialData.address?.state || '');
        setPinCode(initialData.address?.pinCode || '');

        setBankName(initialData.bankDetails?.bankName || '');
        setIfscCode(initialData.bankDetails?.ifscCode || '');
        setAccountNumber(initialData.bankDetails?.accountNumber || '');
      } else {
        // Reset form
        setFirstName(''); setLastName(''); setDepartment(''); setDesignation(''); setPersonalEmail(''); setPhone('');
        setEmergencyContactName(''); setEmergencyContactPhone(''); setEmergencyContactRelation('');
        setMonthlyGrossSalary(''); setJoiningDate(new Date().toISOString().substring(0, 10));
        setShowJoiningDatePicker(false);
        setAadhaarNumber(''); setPanCardNumber('');
        setCanLogin(false); setEmailPrefix(''); setRole(0);
        setAddressLine1(''); setAddressLine2(''); setCity(''); setStateName(''); setPinCode('');
        setBankName(''); setIfscCode(''); setAccountNumber('');
      }
    }
  }, [visible, initialData]);

  const onJoiningDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowJoiningDatePicker(false);
    if (selectedDate) {
      setJoiningDate(selectedDate.toISOString().substring(0, 10));
    }
  };

  const handleSubmit = () => {
    if (!firstName || !lastName || !department || !designation || !monthlyGrossSalary || !joiningDate || !aadhaarNumber || !panCardNumber || !addressLine1 || !city || !stateName || !pinCode || !bankName || !ifscCode || !accountNumber) {
      AppAlertStatic.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    if (canLogin && !emailPrefix) {
      AppAlertStatic.alert('Validation Error', 'Corporate Email prefix is required if login is enabled.');
      return;
    }

    const fullEmail = canLogin && emailPrefix ? `${emailPrefix}@${companyDomain}` : '';

    const payload = {
      ...(initialData?.entityId ? { entityId: initialData.entityId } : {}),
      firstName,
      lastName,
      designation,
      department,
      monthlyGrossSalary: parseFloat(monthlyGrossSalary) || 0,
      joiningDate: new Date(joiningDate).toISOString(),
      aadhaarNumber,
      panCardNumber,
      canLogin,
      email: fullEmail,
      personalEmail,
      phone,
      emergencyContact: {
        name: emergencyContactName,
        phone: emergencyContactPhone,
        relation: emergencyContactRelation
      },
      role,
      address: {
        addressLine1,
        addressLine2,
        city,
        state: stateName,
        pinCode,
        country: 'India'
      },
      bankDetails: {
        accountHolderName: `${firstName} ${lastName}`.trim(),
        accountNumber,
        bankName,
        ifscCode,
        isActive: true
      }
    };

    onSubmit(payload);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{initialData ? 'Edit Employee' : 'Onboard Employee'}</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>Cancel</Text></TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Profile Identity</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First Name" />
            </View>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last Name" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Personal Email</Text>
              <TextInput style={styles.input} value={personalEmail} onChangeText={setPersonalEmail} placeholder="name@personal.com" keyboardType="email-address" />
            </View>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <PhoneNumberInput value={phone} onChangeText={setPhone} placeholder="Phone" />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Emergency Contact</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput style={styles.input} value={emergencyContactName} onChangeText={setEmergencyContactName} placeholder="Contact Name" />
            </View>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Relation</Text>
              <TextInput style={styles.input} value={emergencyContactRelation} onChangeText={setEmergencyContactRelation} placeholder="e.g. Spouse" />
            </View>
          </View>
          <Text style={styles.inputLabel}>Emergency Phone</Text>
          <PhoneNumberInput value={emergencyContactPhone} onChangeText={setEmergencyContactPhone} placeholder="Emergency Phone" />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Department *</Text>
              <DropdownPicker
                options={departments.map(d => ({ label: d, value: d }))}
                selectedValue={department}
                onSelect={(val) => setDepartment(val as string)}
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Designation *</Text>
              {designations.length > 0 ? (
                <DropdownPicker
                  options={designations.map(d => ({ label: d, value: d }))}
                  selectedValue={designation}
                  onSelect={(val) => setDesignation(val as string)}
                  containerStyle={{ marginBottom: 0 }}
                />
              ) : (
                <TextInput style={styles.input} value={designation} onChangeText={setDesignation} placeholder="Designation" />
              )}
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Compensation & Joining</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Gross Salary (₹) *</Text>
              <TextInput style={styles.input} value={monthlyGrossSalary} onChangeText={setMonthlyGrossSalary} placeholder="e.g. 85000" keyboardType="numeric" />
            </View>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Joining Date *</Text>
              <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={() => setShowJoiningDatePicker(true)}>
                <Text style={{ color: '#111827', fontSize: 14 }}>{joiningDate}</Text>
              </TouchableOpacity>
              {showJoiningDatePicker && (
                <DateTimePicker
                  value={new Date(joiningDate)}
                  mode="date"
                  display="default"
                  onValueChange={onJoiningDateChange}
                  onDismiss={() => setShowJoiningDatePicker(false)}
                />
              )}
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Aadhaar *</Text>
              <TextInput style={styles.input} value={aadhaarNumber} onChangeText={setAadhaarNumber} placeholder="12 Digit Aadhaar" maxLength={12} keyboardType="numeric" />
            </View>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>PAN Card *</Text>
              <TextInput style={[styles.input, { textTransform: 'uppercase' }]} value={panCardNumber} onChangeText={setPanCardNumber} placeholder="10 Char PAN" maxLength={10} />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Residential Address</Text>
          <Text style={styles.inputLabel}>Address Line 1 *</Text>
          <TextInput style={styles.input} value={addressLine1} onChangeText={setAddressLine1} placeholder="Address Line 1" />
          
          <Text style={styles.inputLabel}>Address Line 2</Text>
          <TextInput style={styles.input} value={addressLine2} onChangeText={setAddressLine2} placeholder="Address Line 2" />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>City *</Text>
              <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City" />
            </View>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>State *</Text>
              <TextInput style={styles.input} value={stateName} onChangeText={setStateName} placeholder="State" />
            </View>
          </View>
          <View style={styles.col}>
              <Text style={styles.inputLabel}>Pin Code *</Text>
              <TextInput style={styles.input} value={pinCode} onChangeText={setPinCode} placeholder="Pin Code" keyboardType="numeric" />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Remittance Bank Details</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Bank Name *</Text>
              <TextInput style={styles.input} value={bankName} onChangeText={setBankName} placeholder="e.g. HDFC Bank" />
            </View>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>IFSC Code *</Text>
              <TextInput style={[styles.input, { textTransform: 'uppercase' }]} value={ifscCode} onChangeText={setIfscCode} placeholder="IFSC Code" maxLength={11} />
            </View>
          </View>
          <Text style={styles.inputLabel}>Account Number *</Text>
          <TextInput style={styles.input} value={accountNumber} onChangeText={setAccountNumber} placeholder="Account Number" keyboardType="numeric" />

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Security & Access</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Generate portal credentials</Text>
            <Switch value={canLogin} onValueChange={setCanLogin} trackColor={{ false: '#D1D5DB', true: '#2563EB' }} />
          </View>

          {canLogin && (
            <>
              <Text style={styles.inputLabel}>Corporate Email Prefix *</Text>
              <View style={styles.emailInputRow}>
                <TextInput style={styles.emailInput} value={emailPrefix} onChangeText={setEmailPrefix} placeholder="username" autoCapitalize="none" />
                <View style={styles.emailDomain}>
                  <Text style={styles.emailDomainText}>@{companyDomain}</Text>
                </View>
              </View>
              
              <Text style={styles.inputLabel}>System Role *</Text>
              <View style={styles.roleContainer}>
                {[
                  { label: 'Standard', value: 0 },
                  { label: 'Manager', value: 1 },
                  { label: 'Admin', value: 2 },
                  { label: 'Super Admin', value: 3 }
                ].map(r => (
                  <TouchableOpacity 
                    key={r.value} 
                    style={[styles.roleBtn, role === r.value && styles.roleBtnActive]}
                    onPress={() => setRole(r.value)}
                  >
                    <Text style={[styles.roleBtnText, role === r.value && styles.roleBtnTextActive]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{initialData ? 'Save Changes' : 'Onboard Employee'}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalContent: {
    padding: 20,
    paddingBottom: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginTop: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  emailInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emailInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  emailDomain: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderLeftWidth: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  emailDomainText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  roleBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  roleBtnActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  roleBtnText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  roleBtnTextActive: {
    color: '#1D4ED8',
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  }
});
