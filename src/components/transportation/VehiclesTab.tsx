import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../../components/AppText';
import type { Vehicle } from '../../types';
import { FuelTariffsCard } from './FuelTariffsCard';
import type { FuelPrices } from '../../types';
import { SkeletonLoader } from '../ui/SkeletonLoader';

interface VehiclesTabProps {
  vehicles: Vehicle[];
  fuelPrices: FuelPrices;
  loading?: boolean;
  onRefreshFuel: () => void;
  onToggleAvailability: (vehicle: Vehicle) => void;
  onAddVehicle: () => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
}

export function VehiclesTab({ vehicles, fuelPrices, loading, onRefreshFuel, onToggleAvailability, onAddVehicle, onSelectVehicle }: VehiclesTabProps) {
  
  const renderLoaders = () => {
    return Array(4).fill(0).map((_, i) => (
      <View key={`skeleton-${i}`} style={styles.listRow}>
        <View style={styles.meta}>
          <SkeletonLoader height={20} width="60%" style={{ marginBottom: 8 }} />
          <SkeletonLoader height={14} width="40%" />
        </View>
        <SkeletonLoader height={32} width={80} borderRadius={20} />
      </View>
    ));
  };

  return (
    <View style={styles.panel}>
      <FuelTariffsCard currentPrices={fuelPrices} onSuccess={onRefreshFuel} />

      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Registered Fleet</Text>
        <TouchableOpacity style={styles.addBtnMini} onPress={onAddVehicle}>
          <Text style={styles.addBtnMiniText}>+ Add Vehicle</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        renderLoaders()
      ) : vehicles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No vehicles registered yet.</Text>
        </View>
      ) : (
        vehicles.map(v => (
          <TouchableOpacity 
            key={v.entityId} 
            style={styles.listRow}
            onPress={() => onSelectVehicle(v)}
            activeOpacity={0.8}
          >
            <View style={styles.meta}>
              <View style={styles.titleRow}>
                <Text style={styles.metaTitle}>{v.name}</Text>
                <View style={styles.fuelBadge}>
                  <Text style={styles.fuelBadgeText}>{v.fuelType}</Text>
                </View>
              </View>
              <Text style={styles.metaSub}>
                {v.licensePlate} · {v.mileagePerLiter} {v.fuelType === 'EV' ? 'km/kWh' : 'km/L'} · {v.currentOdometerKm || 0} km
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity 
                style={[styles.statusTag, v.isAvailable ? styles.statusAvail : styles.statusMaint]}
                onPress={() => onToggleAvailability(v)}
                activeOpacity={0.7}
              >
                <View style={[styles.statusDot, { backgroundColor: v.isAvailable ? '#059669' : '#DC2626' }]} />
                <Text style={[styles.statusText, { color: v.isAvailable ? '#065F46' : '#991B1B' }]}>
                  {v.isAvailable ? 'Available' : 'Maint.'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.chevron}>→</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addBtnMini: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnMiniText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 15,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  meta: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  fuelBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fuelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  metaSub: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusAvail: {
    backgroundColor: '#D1FAE5',
  },
  statusMaint: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});
