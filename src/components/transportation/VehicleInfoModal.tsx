import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';

interface VehicleInfoModalProps {
  visible: boolean;
  vehicle: any | null;
  onClose: () => void;
  onEdit: () => void;
}

export const VehicleInfoModal: React.FC<VehicleInfoModalProps> = ({ visible, vehicle, onClose, onEdit }) => {
  if (!vehicle) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Vehicle Profile</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.profileCard}>
            <View style={styles.iconContainer}>
              <Text style={{ fontSize: 32 }}>🚚</Text>
            </View>
            <Text style={styles.vehicleName}>{vehicle.name}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.plateBadge}>
                <Text style={styles.plateText}>{vehicle.licensePlate}</Text>
              </View>
              <View style={[styles.statusBadge, vehicle.isAvailable ? styles.statusAvail : styles.statusMaint]}>
                <Text style={[styles.statusText, { color: vehicle.isAvailable ? '#065F46' : '#991B1B' }]}>
                  {vehicle.isAvailable ? 'Active Fleet' : 'In Maintenance'}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Technical Specifications</Text>
          <View style={styles.specsCard}>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Odometer Reading</Text>
              <Text style={styles.specValue}>{vehicle.currentOdometerKm || 0} km</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Fuel Efficiency</Text>
              <Text style={styles.specValue}>
                {vehicle.mileagePerLiter} {vehicle.fuelType === 'EV' ? 'km/kWh' : 'km/L'}
              </Text>
            </View>
            <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.specLabel}>Engine / Fuel Type</Text>
              <Text style={styles.specValue}>{vehicle.fuelType}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.editBtn} 
            onPress={onEdit}
          >
            <Text style={styles.editBtnText}>Edit Vehicle Settings</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  closeText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 24,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  plateBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  plateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusAvail: {
    backgroundColor: '#D1FAE5',
  },
  statusMaint: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginBottom: 12,
    marginLeft: 4,
  },
  specsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 32,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  specLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  specValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  editBtn: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
