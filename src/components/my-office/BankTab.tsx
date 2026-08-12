import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../AppText';
import { FormInput } from './FormInput';
import { OfficeProfile, BankAccount, OfficeService } from '../../api/officeService';

interface BankTabProps { isEditing: boolean;
  profile: OfficeProfile;
  setProfile: (profile: OfficeProfile) => void;
}

export function BankTab({ profile, isEditing, setProfile }: BankTabProps) {
  const addBankAccount = () => {
    const newAcc: BankAccount = {
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      isActive: !profile.bankAccounts?.length,
    };
    setProfile({
      ...profile,
      bankAccounts: [...(profile.bankAccounts || []), newAcc],
    });
  };

  const updateBankAccount = (index: number, field: keyof BankAccount, value: any) => {
    const accounts = [...(profile.bankAccounts || [])];
    (accounts[index] as any)[field] = value;
    setProfile({ ...profile, bankAccounts: accounts });
  };

  const setActiveBankAccount = (index: number) => {
    if (!profile.bankAccounts) return;
    const accounts = profile.bankAccounts.map((a, i) => ({
      ...a,
      isActive: i === index,
    }));
    setProfile({ ...profile, bankAccounts: accounts });
  };

  const removeBankAccount = (index: number) => {
    if (!profile.bankAccounts) return;
    setProfile({
      ...profile,
      bankAccounts: profile.bankAccounts.filter((_, i) => i !== index),
    });
  };

  return (
    <View style={styles.section}>
      <View style={styles.bankHeader}>
        <Text style={styles.sectionTitle}>Bank Accounts</Text>
        <TouchableOpacity onPress={addBankAccount}>
          <Text style={styles.addBankText}>+ Add Account</Text>
        </TouchableOpacity>
      </View>

      {(!profile.bankAccounts || profile.bankAccounts.length === 0) && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No bank accounts configured.</Text>
          <Text style={styles.emptySubtext}>Add one to include in invoices.</Text>
        </View>
      )}

      {profile.bankAccounts?.map((acc, idx) => (
        <View key={idx} style={styles.bankCard}>
          <View style={styles.bankCardHeader}>
            <TouchableOpacity
              style={styles.radioRow}
              onPress={() => setActiveBankAccount(idx)}
            >
              <View style={[styles.radio, acc.isActive && styles.radioActive]}>
                {acc.isActive && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.radioLabel}>
                {acc.isActive ? 'Active Billing Account' : 'Set as Active'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeBankAccount(idx)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.twoCol}>
            <View style={styles.halfField}>
              <FormInput editable={isEditing}
                label="Bank Name"
                value={acc.bankName}
                onChangeText={v => updateBankAccount(idx, 'bankName', v)}
                placeholder="Bank name"
              />
            </View>
            <View style={styles.halfField}>
              <FormInput editable={isEditing}
                label="Account Number"
                value={acc.accountNumber}
                onChangeText={v => updateBankAccount(idx, 'accountNumber', v)}
                placeholder="Account number"
                keyboardType="number-pad"
              />
            </View>
          </View>
          <View style={styles.twoCol}>
            <View style={styles.halfField}>
              <FormInput editable={isEditing}
                label="Account Holder"
                value={acc.accountHolderName}
                onChangeText={v => updateBankAccount(idx, 'accountHolderName', v)}
                placeholder="Holder name"
              />
            </View>
            <View style={styles.halfField}>
              <FormInput editable={isEditing}
                label="IFSC Code"
                value={acc.ifscCode}
                onChangeText={v => updateBankAccount(idx, 'ifscCode', v)}
                placeholder="IFSC code"
                autoCapitalize="characters"
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
    paddingLeft: 2,
  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 8,
  },
  addBankText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  bankCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
  },
  bankCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: '#2563EB',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  removeText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
});
