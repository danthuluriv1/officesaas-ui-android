import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../AppText';
import { OfficeProfile } from '../../api/officeService';

interface OrgTabProps { isEditing: boolean;
  profile: OfficeProfile;
  setProfile: (profile: OfficeProfile) => void;
}

export function OrgTab({ profile, isEditing, setProfile }: OrgTabProps) {
  const [newDept, setNewDept] = useState('');
  const [newDesig, setNewDesig] = useState('');

  const addDepartment = () => {
    if (!newDept.trim()) return;
    if (profile.departments?.includes(newDept.trim())) return;
    setProfile({
      ...profile,
      departments: [...(profile.departments || []), newDept.trim()],
    });
    setNewDept('');
  };

  const removeDepartment = (dept: string) => {
    setProfile({
      ...profile,
      departments: profile.departments?.filter(d => d !== dept) || [],
    });
  };

  const addDesignation = () => {
    if (!newDesig.trim()) return;
    if (profile.designations?.includes(newDesig.trim())) return;
    setProfile({
      ...profile,
      designations: [...(profile.designations || []), newDesig.trim()],
    });
    setNewDesig('');
  };

  const removeDesignation = (desig: string) => {
    setProfile({
      ...profile,
      designations: profile.designations?.filter(d => d !== desig) || [],
    });
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Departments</Text>
      <View style={styles.card}>
        <View style={styles.chipInputRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={newDept}
            onChangeText={setNewDept}
            placeholder="e.g. Engineering"
            placeholderTextColor="#9CA3AF"
            onSubmitEditing={addDepartment}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addChipBtn} onPress={addDepartment}>
            <Text style={styles.addChipBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chipContainer}>
          {(!profile.departments || profile.departments.length === 0) && (
            <Text style={styles.emptyChipText}>No departments added</Text>
          )}
          {profile.departments?.map((dept, idx) => (
            <View key={idx} style={styles.chip}>
              <Text style={styles.chipText}>{dept}</Text>
              <TouchableOpacity onPress={() => removeDepartment(dept)}>
                <Text style={styles.chipRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Designations</Text>
      <View style={styles.card}>
        <View style={styles.chipInputRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={newDesig}
            onChangeText={setNewDesig}
            placeholder="e.g. Software Engineer"
            placeholderTextColor="#9CA3AF"
            onSubmitEditing={addDesignation}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addChipBtn} onPress={addDesignation}>
            <Text style={styles.addChipBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chipContainer}>
          {(!profile.designations || profile.designations.length === 0) && (
            <Text style={styles.emptyChipText}>No designations added</Text>
          )}
          {profile.designations?.map((desig, idx) => (
            <View key={idx} style={styles.chip}>
              <Text style={styles.chipText}>{desig}</Text>
              <TouchableOpacity onPress={() => removeDesignation(desig)}>
                <Text style={styles.chipRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
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
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
  },
  chipInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addChipBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addChipBtnText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  emptyChipText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontStyle: 'italic',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  chipRemove: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '700',
  },
});
