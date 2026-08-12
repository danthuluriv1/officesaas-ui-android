import React, { useState } from 'react';
import { Theme } from '../../theme';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { VendorService } from '../../api/vendorService';
import { LocationPicker } from '../ui/LocationPicker';
import { AppAlertStatic } from '../ui/AppAlert';
import { PhoneNumberInput } from '../ui/PhoneNumberInput';

interface AddVendorModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddVendorModal: React.FC<AddVendorModalProps> = ({ visible, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [contactPerson1, setContactPerson1] = useState('');
  const [contactPersonDesignation, setContactPersonDesignation] = useState('');
  const [contactPerson2, setContactPerson2] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [gstin, setGstin] = useState('');
  
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [village, setVillage] = useState('');
  const [mandal, setMandal] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('');
  const [pinCode, setPinCode] = useState('');

  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // Location picker states
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleAddVendor = async () => {
    if (!companyName || !contactPerson1 || !email || !phone || !addressLine1 || !city || !stateName || !pinCode) {
      AppAlertStatic.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        companyName,
        contactPerson1,
        contactPersonDesignation,
        contactPerson2,
        email,
        phone,
        secondaryPhone,
        gstin,
        address: {
          addressLine1,
          addressLine2,
          village,
          mandal,
          city,
          district,
          state: stateName,
          pinCode,
          country: 'India',
          latitude,
          longitude
        },
        bankDetails: {
          accountHolderName,
          accountNumber,
          bankName,
          ifscCode,
          isActive: true
        }
      };

      const response = await VendorService.addVendor(payload);
      if (response.data?.isSuccess) {
        AppAlertStatic.alert('Success', 'Vendor added successfully!');
        setCompanyName(''); setContactPerson1(''); setContactPersonDesignation(''); setContactPerson2('');
        setEmail(''); setPhone(''); setSecondaryPhone(''); setGstin('');
        setAddressLine1(''); setAddressLine2(''); setVillage(''); setMandal('');
        setCity(''); setDistrict(''); setStateName(''); setPinCode('');
        setAccountHolderName(''); setAccountNumber(''); setBankName(''); setIfscCode('');
        setLatitude(undefined); setLongitude(undefined);
        onSuccess();
        onClose();
      } else {
        AppAlertStatic.alert('Error', response.data?.message || 'Failed to add vendor');
      }
    } catch (err: any) {
      AppAlertStatic.alert('Error', err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <LocationPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        initialLat={latitude}
        initialLng={longitude}
        onSelectLocation={(lat, lng) => {
          setLatitude(lat);
          setLongitude(lng);
        }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Vendor</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>Cancel</Text></TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Basic Info</Text>
          <Text style={styles.inputLabel}>Company Name *</Text>
          <TextInput style={styles.input} value={companyName} onChangeText={setCompanyName} placeholder="Company Name" />
          
          <Text style={styles.inputLabel}>GSTIN</Text>
          <TextInput style={[styles.input, { textTransform: 'uppercase' }]} value={gstin} onChangeText={setGstin} placeholder="15 Digit GSTIN" maxLength={15} />

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Primary Contact</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput style={styles.input} value={contactPerson1} onChangeText={setContactPerson1} placeholder="Name" />
            </View>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Designation</Text>
              <TextInput style={styles.input} value={contactPersonDesignation} onChangeText={setContactPersonDesignation} placeholder="Role" />
            </View>
          </View>

          <Text style={styles.inputLabel}>Email *</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />

          <Text style={styles.inputLabel}>Primary Phone *</Text>
          <PhoneNumberInput value={phone} onChangeText={setPhone} placeholder="Phone" />

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Secondary Contact</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput style={styles.input} value={contactPerson2} onChangeText={setContactPerson2} placeholder="Name" />
            </View>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Secondary Phone</Text>
              <PhoneNumberInput value={secondaryPhone} onChangeText={setSecondaryPhone} placeholder="Phone" />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Address & Location</Text>

          <TouchableOpacity 
            style={[styles.locationBtn, latitude && longitude ? styles.locationBtnSelected : null]} 
            onPress={() => setPickerVisible(true)}
          >
            <Text style={[styles.locationBtnText, latitude && longitude ? styles.locationBtnTextSelected : null]}>
              {latitude && longitude 
                ? `📍 Pin Dropped (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` 
                : '🗺️ Pinpoint Delivery Coordinates on Map'
              }
            </Text>
          </TouchableOpacity>
          <Text style={styles.inputLabel}>Street Address *</Text>
          <TextInput style={styles.input} value={addressLine1} onChangeText={setAddressLine1} placeholder="Address Line 1" />
          
          <Text style={styles.inputLabel}>Address Line 2</Text>
          <TextInput style={styles.input} value={addressLine2} onChangeText={setAddressLine2} placeholder="Address Line 2" />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>City *</Text>
              <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City" />
            </View>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>District</Text>
              <TextInput style={styles.input} value={district} onChangeText={setDistrict} placeholder="District" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>State *</Text>
              <TextInput style={styles.input} value={stateName} onChangeText={setStateName} placeholder="State" />
            </View>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Pin Code *</Text>
              <TextInput style={styles.input} value={pinCode} onChangeText={setPinCode} placeholder="Pin Code" keyboardType="numeric" />
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Village</Text>
              <TextInput style={styles.input} value={village} onChangeText={setVillage} placeholder="Village" />
            </View>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Mandal</Text>
              <TextInput style={styles.input} value={mandal} onChangeText={setMandal} placeholder="Mandal" />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Bank Account Details (Optional)</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Account Name</Text>
              <TextInput style={styles.input} value={accountHolderName} onChangeText={setAccountHolderName} placeholder="Holder Name" />
            </View>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Account Number</Text>
              <TextInput style={styles.input} value={accountNumber} onChangeText={setAccountNumber} placeholder="Acc Number" keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Bank Name</Text>
              <TextInput style={styles.input} value={bankName} onChangeText={setBankName} placeholder="Bank Name" />
            </View>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>IFSC Code</Text>
              <TextInput style={[styles.input, { textTransform: 'uppercase' }]} value={ifscCode} onChangeText={setIfscCode} placeholder="IFSC Code" />
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleAddVendor} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Save Vendor</Text>}
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
    fontSize: 16,
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
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  locationBtn: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  locationBtnSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  locationBtnText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  locationBtnTextSelected: {
    color: '#1D4ED8',
    fontWeight: '700',
  }
});
