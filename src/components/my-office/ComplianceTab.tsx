import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from '../AppText';
import { FormInput } from './FormInput';
import { OfficeProfile } from '../../api/officeService';

interface ComplianceTabProps { isEditing: boolean;
  profile: OfficeProfile;
  updateField: (field: keyof OfficeProfile, value: any) => void;
}

export function ComplianceTab({ profile, isEditing, updateField }: ComplianceTabProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tax Registration</Text>
      <View style={styles.card}>
        <FormInput editable={isEditing}
          label="GSTIN"
          value={profile.gstin || ''}
          onChangeText={v => updateField('gstin', v)}
          placeholder="Goods and Services Tax ID"
          autoCapitalize="characters"
        />
        <FormInput editable={isEditing}
          label="PAN"
          value={profile.pan || ''}
          onChangeText={v => updateField('pan', v)}
          placeholder="Permanent Account Number"
          autoCapitalize="characters"
        />
        <FormInput editable={isEditing}
          label="CIN"
          value={profile.cin || ''}
          onChangeText={v => updateField('cin', v)}
          placeholder="Corporate Identification Number"
          autoCapitalize="characters"
        />
      </View>

      <Text style={styles.sectionTitle}>Payroll & Labor</Text>
      <View style={styles.card}>
        <FormInput editable={isEditing}
          label="EPF Number"
          value={profile.epfNumber || ''}
          onChangeText={v => updateField('epfNumber', v)}
          placeholder="EPF Registration Number"
        />
        <FormInput editable={isEditing}
          label="ESI Number"
          value={profile.esiNumber || ''}
          onChangeText={v => updateField('esiNumber', v)}
          placeholder="ESI Registration Number"
        />
      </View>
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
  card: {
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
  },
});
