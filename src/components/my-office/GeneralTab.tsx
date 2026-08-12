import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../AppText';
import { FormInput } from './FormInput';
import { PhoneNumberInput } from '../ui/PhoneNumberInput';
import { OfficeProfile } from '../../api/officeService';

interface GeneralTabProps {
  profile: OfficeProfile;
  isEditing: boolean;
  updateField: (field: keyof OfficeProfile, value: any) => void;
  updateAddress: (field: string, value: any) => void;
  onOpenLocationPicker: () => void;
}

export function GeneralTab({ profile, isEditing, updateField, updateAddress, onOpenLocationPicker }: GeneralTabProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Company Information</Text>
      <View style={styles.card}>
        <FormInput editable={isEditing}
          label="Company Name"
          value={profile.name}
          onChangeText={v => updateField('name', v)}
          placeholder="Enter company name"
        />
        <FormInput editable={isEditing}
          label="Contact Email"
          value={profile.email}
          onChangeText={v => updateField('email', v)}
          placeholder="Enter email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.fieldRow}>
          <Text style={styles.label}>Support Phone</Text>
          <PhoneNumberInput
            value={profile.phone}
            onChangeText={(text) => updateField('phone', text)}
            placeholder="e.g. +91 9876543210"
            disabled={!isEditing}
          />
        </View>
        <FormInput editable={isEditing}
          label="Company Domain"
          value={profile.companyDomain || ''}
          onChangeText={v => updateField('companyDomain', v)}
          placeholder="e.g. acmecorp.com"
          autoCapitalize="none"
        />
      </View>

      {/* Address */}
      <Text style={styles.sectionTitle}>Address</Text>
      <View style={styles.card}>
        <FormInput editable={isEditing}
          label="Address Line 1"
          value={profile.address?.addressLine1 || ''}
          onChangeText={v => updateAddress('addressLine1', v)}
          placeholder="Street address"
        />
        <FormInput editable={isEditing}
          label="Address Line 2"
          value={profile.address?.addressLine2 || ''}
          onChangeText={v => updateAddress('addressLine2', v)}
          placeholder="Apt, suite, floor"
        />
        
        <View style={styles.twoCol}>
          <View style={styles.halfField}>
            <FormInput editable={isEditing}
              label="Village"
              value={profile.address?.village || ''}
              onChangeText={v => updateAddress('village', v)}
            />
          </View>
          <View style={styles.halfField}>
            <FormInput editable={isEditing}
              label="Mandal"
              value={profile.address?.mandal || ''}
              onChangeText={v => updateAddress('mandal', v)}
            />
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.halfField}>
            <FormInput editable={isEditing}
              label="City"
              value={profile.address?.city || ''}
              onChangeText={v => updateAddress('city', v)}
            />
          </View>
          <View style={styles.halfField}>
            <FormInput editable={isEditing}
              label="District"
              value={profile.address?.district || ''}
              onChangeText={v => updateAddress('district', v)}
            />
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.halfField}>
            <FormInput editable={isEditing}
              label="State"
              value={profile.address?.state || ''}
              onChangeText={v => updateAddress('state', v)}
            />
          </View>
          <View style={styles.halfField}>
            <FormInput editable={isEditing}
              label="Pin Code"
              value={profile.address?.pinCode || ''}
              onChangeText={v => updateAddress('pinCode', v)}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <FormInput editable={isEditing}
          label="Country"
          value={profile.address?.country || 'India'}
          onChangeText={v => updateAddress('country', v)}
        />
      </View>

      {/* Location Coordinates */}
      <Text style={styles.sectionTitle}>Office Location (GPS)</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={[
            styles.locationBtn,
            profile.address?.latitude && profile.address?.longitude
              ? styles.locationBtnSet
              : null,
          ]}
          onPress={onOpenLocationPicker}
        >
          <Text
            style={[
              styles.locationBtnText,
              profile.address?.latitude && profile.address?.longitude
                ? styles.locationBtnTextSet
                : null,
            ]}
          >
            {profile.address?.latitude && profile.address?.longitude
              ? `📍 ${profile.address.latitude.toFixed(5)}, ${profile.address.longitude.toFixed(5)}`
              : '📍 Set Office Location on Map'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  fieldRow: {
    gap: 4,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
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
    gap: 2, // FormInput already has marginBottom
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  locationBtn: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  locationBtnSet: {
    borderColor: '#34D399',
    backgroundColor: '#ECFDF5',
    borderStyle: 'solid',
  },
  locationBtnText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 15,
  },
  locationBtnTextSet: {
    color: '#059669',
  },
});
