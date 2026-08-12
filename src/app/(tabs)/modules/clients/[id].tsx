import React, { useState, useEffect } from 'react';
import { Theme } from '../../../../theme';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { AppText as Text } from '../../../../components/AppText';
import { useLocalSearchParams } from 'expo-router';
import axiosClient from '../../../../api/axiosClient';
import { LocationPicker } from '../../../../components/ui/LocationPicker';
import { AppAlertStatic } from '../../../../components/ui/AppAlert';
import { PhoneNumberInput } from '../../../../components/ui/PhoneNumberInput';

interface ClientAddress {
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

interface ClientDetail {
  entityId: string;
  companyName: string;
  contactPerson1?: string;
  contactPersonDesignation?: string;
  contactPerson2?: string;
  email?: string;
  phone?: string;
  secondaryPhone?: string;
  gstin?: string;
  address?: ClientAddress;
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams();
  const [client, setClient] = useState<ClientDetail | null>(null);
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

  const fetchClient = async () => {
    try {
      const response = await axiosClient.get(`/Clients/${id}`);
      if (response.data?.isSuccess) {
        setClient(response.data.data);
      } else {
        setClient(response.data);
      }
    } catch (err) {
      console.warn('Failed to fetch client details', err);
      AppAlertStatic.alert('Error', 'Failed to load client details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchClient();
    }
  }, [id]);

  const handleOpenEdit = () => {
    if (!client) return;
    setCompanyName(client.companyName || '');
    setContactPerson1(client.contactPerson1 || '');
    setContactPersonDesignation(client.contactPersonDesignation || '');
    setContactPerson2(client.contactPerson2 || '');
    setEmail(client.email || '');
    setPhone(client.phone || '');
    setSecondaryPhone(client.secondaryPhone || '');
    setGstin(client.gstin || '');
    
    setAddressLine1(client.address?.addressLine1 || '');
    setAddressLine2(client.address?.addressLine2 || '');
    setVillage(client.address?.village || '');
    setMandal(client.address?.mandal || '');
    setCity(client.address?.city || '');
    setDistrict(client.address?.district || '');
    setStateName(client.address?.state || '');
    setPinCode(client.address?.pinCode || '');
    
    // Set coordinates
    setLatitude(client.address?.latitude);
    setLongitude(client.address?.longitude);
    
    setModalVisible(true);
  };

  const handleEditClient = async () => {
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
        }
      };

      const response = await axiosClient.put(`/Clients/${id}`, payload);
      if (response.data?.isSuccess) {
        AppAlertStatic.alert('Success', 'Client updated successfully!');
        setModalVisible(false);
        fetchClient();
      } else {
        AppAlertStatic.alert('Error', response.data?.message || 'Failed to update client');
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
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Client not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.headerActionsRow}>
          <View style={{ width: 40 }} />
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{client.companyName.substring(0, 1).toUpperCase()}</Text>
          </View>
          <TouchableOpacity onPress={handleOpenEdit} style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.companyName}>{client.companyName}</Text>
        {client.gstin ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>GSTIN: {client.gstin}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Primary Contact</Text>
          <Text style={styles.infoValue}>{client.contactPerson1 || 'N/A'}</Text>
        </View>
        
        {client.contactPersonDesignation ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Designation</Text>
            <Text style={styles.infoValue}>{client.contactPersonDesignation}</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{client.email || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{client.phone || 'N/A'}</Text>
        </View>

        {client.contactPerson2 ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Secondary Contact</Text>
            <Text style={styles.infoValue}>{client.contactPerson2}</Text>
          </View>
        ) : null}

        {client.secondaryPhone ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Secondary Phone</Text>
            <Text style={styles.infoValue}>{client.secondaryPhone}</Text>
          </View>
        ) : null}
      </View>

      {client.address && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address & Location</Text>
          <Text style={styles.addressText}>
            {[
              client.address.addressLine1,
              client.address.addressLine2,
              client.address.village,
              client.address.mandal,
              client.address.city,
              client.address.district,
              client.address.state,
              client.address.pinCode,
              client.address.country
            ].filter(Boolean).join(', ')}
          </Text>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>GPS Coordinates</Text>
            <Text style={styles.infoValue}>
              {client.address.latitude && client.address.longitude 
                ? `${client.address.latitude.toFixed(5)}, ${client.address.longitude.toFixed(5)}` 
                : 'Not Set'}
            </Text>
          </View>
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Client</Text>
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

            <TouchableOpacity style={styles.submitBtn} onPress={handleEditClient} disabled={submitting}>
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
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2563EB',
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
