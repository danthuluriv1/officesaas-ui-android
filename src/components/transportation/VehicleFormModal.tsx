import React, { useState, useEffect } from 'react';
import { Theme } from '../../theme';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { TransportationService } from '../../api/transportationService';
import { DropdownPicker } from '../ui/DropdownPicker';
import type { Vehicle } from '../../types';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

interface VehicleFormModalProps {
  visible: boolean;
  initialVehicle?: Vehicle | null;
  onClose: () => void;
  onSuccess: () => void;
}

const FUEL_OPTIONS = [
  { label: 'Petrol', value: 'Petrol' },
  { label: 'Diesel', value: 'Diesel' },
  { label: 'CNG', value: 'CNG' },
  { label: 'EV (Electric)', value: 'EV' }
];

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({ visible, initialVehicle, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [mileagePerLiter, setMileagePerLiter] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [currentOdometerKm, setCurrentOdometerKm] = useState('0');

  useEffect(() => {
    if (initialVehicle && visible) {
      setName(initialVehicle.name || '');
      setLicensePlate(initialVehicle.licensePlate || '');
      setMileagePerLiter(initialVehicle.mileagePerLiter?.toString() || '');
      setFuelType(initialVehicle.fuelType || 'Petrol');
      setCurrentOdometerKm(initialVehicle.currentOdometerKm?.toString() || '0');
    } else if (visible) {
      setName('');
      setLicensePlate('');
      setMileagePerLiter('');
      setFuelType('Petrol');
      setCurrentOdometerKm('0');
    }
  }, [initialVehicle, visible]);

  const handleSubmit = async () => {
    if (!name || !licensePlate || !mileagePerLiter) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please fill in all required fields.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        licensePlate,
        mileagePerLiter: parseFloat(mileagePerLiter) || 15.0,
        fuelType,
        currentOdometerKm: parseFloat(currentOdometerKm) || 0.0,
        isAvailable: initialVehicle ? initialVehicle.isAvailable : true,
      };

      if (initialVehicle) {
        await TransportationService.updateVehicle(initialVehicle.entityId, {
          ...initialVehicle,
          ...payload
        });
        Toast.show({ type: 'success', text1: 'Updated', text2: 'Vehicle updated successfully!' });
      } else {
        await TransportationService.createVehicle(payload as any);
        Toast.show({ type: 'success', text1: 'Registered', text2: 'Vehicle registered successfully!' });
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
      onClose();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || err.message || 'Failed to save vehicle' });
    } finally {
      setSubmitting(false);
    }
  };

  const isEdit = !!initialVehicle;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEdit ? 'Edit Vehicle' : 'Register New Vehicle'}</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>Cancel</Text></TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Vehicle Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Tata Ace Delivery Van" />
          
          <Text style={styles.inputLabel}>License Plate *</Text>
          <TextInput style={styles.input} value={licensePlate} onChangeText={setLicensePlate} placeholder="e.g. TS 09 EA 1234" />

          <Text style={styles.inputLabel}>Efficiency * (km/L or km/kWh)</Text>
          <TextInput style={styles.input} value={mileagePerLiter} onChangeText={setMileagePerLiter} placeholder="e.g. 15" keyboardType="numeric" />

          <Text style={styles.inputLabel}>Current Odometer Reading * (km)</Text>
          <TextInput style={styles.input} value={currentOdometerKm} onChangeText={setCurrentOdometerKm} placeholder="e.g. 0" keyboardType="numeric" />

          <DropdownPicker
            label="Fuel Type"
            options={FUEL_OPTIONS}
            selectedValue={fuelType}
            onSelect={(val) => setFuelType(String(val))}
            containerStyle={{ marginTop: 16 }}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{isEdit ? 'Save Changes' : 'Register Vehicle'}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalContent: {
    padding: 24,
    paddingBottom: 48,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  closeText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
