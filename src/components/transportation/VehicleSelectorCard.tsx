import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../AppText';
import type { Vehicle } from '../../types';

interface VehicleSelectorCardProps {
  vehicles: Vehicle[];
  selectedVehicles: string[];
  onToggleSelection: (id: string) => void;
}

export function VehicleSelectorCard({ vehicles, selectedVehicles, onToggleSelection }: VehicleSelectorCardProps) {
  const availableVehicles = vehicles.filter(v => v.isAvailable);

  return (
    <View style={styles.listCard}>
      {availableVehicles.length === 0 ? (
        <Text style={styles.emptyText}>No available vehicles.</Text>
      ) : (
        availableVehicles.map((v, idx, arr) => {
          const isSelected = selectedVehicles.includes(v.entityId);
          return (
            <TouchableOpacity 
              key={v.entityId} 
              style={[
                styles.itemRow, 
                idx === arr.length - 1 && { borderBottomWidth: 0 },
                isSelected && styles.itemRowActive
              ]}
              onPress={() => onToggleSelection(v.entityId)}
            >
              <View style={styles.itemMeta}>
                <Text style={styles.itemTitle}>{v.name}</Text>
                <Text style={styles.itemSubtitle}>{v.licensePlate} · {v.mileagePerLiter} {v.fuelType === 'EV' ? 'km/kWh' : 'km/L'} · {v.currentOdometerKm || 0} km</Text>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                {isSelected && <Text style={styles.checkIcon}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  emptyText: {
    padding: 24,
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  itemRowActive: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    paddingLeft: 17,
  },
  itemMeta: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkIcon: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
});
