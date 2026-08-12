import React, { useState, useEffect } from 'react';
import { Theme } from '../../../../theme';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { AppText as Text } from '../../../../components/AppText';
import { useLocalSearchParams } from 'expo-router';
import axiosClient from '../../../../api/axiosClient';
import { LocationPicker } from '../../../../components/ui/LocationPicker';
import { AppAlertStatic } from '../../../../components/ui/AppAlert';
import { PhoneNumberInput } from '../../../../components/ui/PhoneNumberInput';

interface VendorAddress {
  addressLine1?: string;
  addressLine2?: string;
  village?: string;
  mandal?: string;
  city?: string;
  district?: string;
  state?: string;
  pinCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

interface VendorBankDetails {
  accountHolderName?: string;
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
}

interface VendorDetail {
  entityId: string;
  companyName: string;
  contactPerson1?: string;
  contactPersonDesignation?: string;
  contactPerson2?: string;
  email?: string;
  phone?: string;
  secondaryPhone?: string;
  gstin?: string;
  address?: VendorAddress;
  bankDetails?: VendorBankDetails;
}

export default function VendorDetailScreen() {
  const { id } = useLocalSearchParams();
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [contactPerson1, setContactPerson1] = useState('');
  const [contactPersonDesignation, setContactPersonDesignation] = useState('');
  const [contactPerson2, setContactPerson2] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [gstin, setGstin] = useState('');
  
  // Address block
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [village, setVillage] = useState('');
  const [mandal, setMandal] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('');
  const [pinCode, setPinCode] = useState('');

  // Location picker states
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [pickerVisible, setPickerVisible] = useState(false);

  // Bank block
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const fetchVendor = async () => {
    try {
      const response = await axiosClient.get(`/Vendors/${id}`);
      if (response.data?.isSuccess) {
        setVendor(response.data.data);
      } else {
        setVendor(response.data);
      }
    } catch (err) {
      console.warn('Failed to fetch vendor details', err);
      AppAlertStatic.alert('Error', 'Failed to load vendor details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchVendor();
    }
  }, [id]);

  const handleOpenEdit = () => {
    if (!vendor) return;
    setCompanyName(vendor.companyName || '');
    setContactPerson1(vendor.contactPerson1 || '');
    setContactPersonDesignation(vendor.contactPersonDesignation || '');
    setContactPerson2(vendor.contactPerson2 || '');
    setEmail(vendor.email || '');
    setPhone(vendor.phone || '');
    setSecondaryPhone(vendor.secondaryPhone || '');
    setGstin(vendor.gstin || '');
    
    setAddressLine1(vendor.address?.addressLine1 || '');
    setAddressLine2(vendor.address?.addressLine2 || '');
    setVillage(vendor.address?.village || '');
    setMandal(vendor.address?.mandal || '');
    setCity(vendor.address?.city || '');
    setDistrict(vendor.address?.district || '');
    setStateName(vendor.address?.state || '');
    setPinCode(vendor.address?.pinCode || '');

    // Set coordinates
    setLatitude(vendor.address?.latitude);
    setLongitude(vendor.address?.longitude);

    setAccountHolderName(vendor.bankDetails?.accountHolderName || '');
    setAccountNumber(vendor.bankDetails?.accountNumber || '');
    setBankName(vendor.bankDetails?.bankName || '');
    setIfscCode(vendor.bankDetails?.ifscCode || '');
    
    setModalVisible(true);
  };

  const handleEditVendor = async () => {
    if (!companyName || !contactPerson1 || !email || !phone || !addressLine1 || !city || !stateName || !pinCode) {
      AppAlertStatic.alert('Validation Error', 'Please fill in all required fields (Company Name, Primary Contact, Email, Phone, AddressLine1, City, State, Pin Code).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        entityId: id,
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

      const response = await axiosClient.put(`/Vendors/${id}`, payload);
      if (response.data?.isSuccess) {
        AppAlertStatic.alert('Success', 'Vendor updated successfully!');
        setModalVisible(false);
        fetchVendor();
      } else {
        AppAlertStatic.alert('Error', response.data?.message || 'Failed to update vendor');
      }
    } catch (err: any) {
      AppAlertStatic.alert('Error', err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EAB308" />
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Vendor not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.headerActionsRow}>
          <View style={{ width: 40 }} />
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{vendor.companyName.substring(0, 1).toUpperCase()}</Text>
          </View>
          <TouchableOpacity onPress={handleOpenEdit} style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.companyName}>{vendor.companyName}</Text>
        {vendor.gstin ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>GSTIN: {vendor.gstin}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Primary Contact</Text>
          <Text style={styles.infoValue}>{vendor.contactPerson1 || 'N/A'}</Text>
        </View>
        
        {vendor.contactPersonDesignation ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Designation</Text>
            <Text style={styles.infoValue}>{vendor.contactPersonDesignation}</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{vendor.email || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{vendor.phone || 'N/A'}</Text>
        </View>

        {vendor.contactPerson2 ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Secondary Contact</Text>
            <Text style={styles.infoValue}>{vendor.contactPerson2}</Text>
          </View>
        ) : null}

        {vendor.secondaryPhone ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Secondary Phone</Text>
            <Text style={styles.infoValue}>{vendor.secondaryPhone}</Text>
          </View>
        ) : null}
      </View>

      {vendor.address && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address & Location</Text>
          <Text style={styles.addressText}>
            {[
              vendor.address.addressLine1,
              vendor.address.addressLine2,
              vendor.address.village,
              vendor.address.mandal,
              vendor.address.city,
              vendor.address.district,
              vendor.address.state,
              vendor.address.pinCode,
              vendor.address.country
            ].filter(Boolean).join(', ')}
          </Text>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>GPS Coordinates</Text>
            <Text style={styles.infoValue}>
              {vendor.address.latitude && vendor.address.longitude 
                ? `${vendor.address.latitude.toFixed(5)}, ${vendor.address.longitude.toFixed(5)}` 
                : 'Not Set'}
            </Text>
          </View>
        </View>
      )}

      {vendor.bankDetails && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Name</Text>
            <Text style={styles.infoValue}>{vendor.bankDetails.accountHolderName || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Number</Text>
            <Text style={styles.infoValue}>{vendor.bankDetails.accountNumber || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bank Name</Text>
            <Text style={styles.infoValue}>{vendor.bankDetails.bankName || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>IFSC Code</Text>
            <Text style={styles.infoValue}>{vendor.bankDetails.ifscCode || 'N/A'}</Text>
          </View>
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Vendor</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.closeText}>Cancel</Text></TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Basic Info</Text>
            <Text style={styles.inputLabel}>Company Name *</Text>
            <TextInput style={styles.input} value={companyName} onChangeText={setCompanyName} placeholder="Company Name" />
            
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Primary Contact *</Text>
                <TextInput style={styles.input} value={contactPerson1} onChangeText={setContactPerson1} placeholder="Name" />
              </View>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Designation</Text>
                <TextInput style={styles.input} value={contactPersonDesignation} onChangeText={setContactPersonDesignation} placeholder="Role" />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
              </View>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Phone *</Text>
                <PhoneNumberInput value={phone} onChangeText={setPhone} placeholder="Phone" />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Secondary Contact</Text>
                <TextInput style={styles.input} value={contactPerson2} onChangeText={setContactPerson2} placeholder="Name" />
              </View>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>GSTIN</Text>
                <TextInput style={[styles.input, { textTransform: 'uppercase' }]} value={gstin} onChangeText={setGstin} placeholder="15 Digit GSTIN" maxLength={15} />
              </View>
            </View>

            <Text style={styles.inputLabel}>Secondary Phone</Text>
            <PhoneNumberInput value={secondaryPhone} onChangeText={setSecondaryPhone} placeholder="Phone" />

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Address & Location</Text>

            {/* Interactive location map pin button */}
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

            <TouchableOpacity style={styles.submitBtn} onPress={handleEditVendor} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

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
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  errorText: {
    textAlign: 'center',
    color: '#EF4444',
    marginTop: 20,
    fontSize: 16,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D97706',
  },
  companyName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 2,
    textAlign: 'right',
  },
  addressText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
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
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
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
