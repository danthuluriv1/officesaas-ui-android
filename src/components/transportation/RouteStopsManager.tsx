import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../AppText';
import { StopItemCard } from './StopItemCard';
import { AddStopsModal } from './AddStopsModal';
import { Button } from '../ui/Button';

interface RouteStopsManagerProps {
  clients: any[];
  vendors: any[];
  selectedClients: { id: string; key: string }[];
  selectedVendors: { id: string; key: string }[];
  clientTargetTimes: Record<string, string>;
  vendorTargetTimes: Record<string, string>;
  onSetSelectedClients: React.Dispatch<React.SetStateAction<{ id: string; key: string }[]>>;
  onSetSelectedVendors: React.Dispatch<React.SetStateAction<{ id: string; key: string }[]>>;
  onSetClientTargetTimes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSetVendorTargetTimes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onOpenPicker: (id: string, type: 'client' | 'vendor') => void;
}

export function RouteStopsManager({
  clients,
  vendors,
  selectedClients,
  selectedVendors,
  clientTargetTimes,
  vendorTargetTimes,
  onSetSelectedClients,
  onSetSelectedVendors,
  onSetClientTargetTimes,
  onSetVendorTargetTimes,
  onOpenPicker,
}: RouteStopsManagerProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const consolidatedItems = useMemo(() => {
    const clientsMapped = clients.filter(c => c.address?.latitude && c.address?.longitude).map(c => ({
      id: c.entityId,
      key: c.entityId,
      name: c.companyName,
      address: `${c.address.addressLine1}, ${c.address.city}`,
      type: 'client' as const
    }));
    
    const vendorsMapped = vendors.filter(v => v.address?.latitude && v.address?.longitude).map(v => ({
      id: v.entityId,
      key: v.entityId,
      name: v.companyName,
      address: `${v.address.addressLine1}, ${v.address.city}`,
      type: 'vendor' as const
    }));

    return [...clientsMapped, ...vendorsMapped];
  }, [clients, vendors]);

  const selectedStopsList = useMemo(() => {
    return consolidatedItems.filter(item => {
      if (item.type === 'client') return selectedClients.some(c => c.id === item.id);
      if (item.type === 'vendor') return selectedVendors.some(v => v.id === item.id);
      return false;
    });
  }, [consolidatedItems, selectedClients, selectedVendors]);

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Clients & Vendors</Text>
        <Button variant="primary" size="sm" onPress={() => setIsModalVisible(true)}>
          + Add Stops
        </Button>
      </View>
      
      <View style={styles.listCard}>
        {selectedStopsList.length === 0 ? (
          <Text style={styles.emptyText}>
            No stops added yet. Click "+ Add Stops" to search and add clients or vendors to the route.
          </Text>
        ) : (
          selectedStopsList.map((item, idx, arr) => {
            const itemStops = item.type === 'client' 
              ? selectedClients.filter(c => c.id === item.id)
              : selectedVendors.filter(v => v.id === item.id);
              
            const isSelected = itemStops.length > 0;
            const onSetSelected = item.type === 'client' ? onSetSelectedClients : onSetSelectedVendors;
            const targetTimes = item.type === 'client' ? clientTargetTimes : vendorTargetTimes;
            const onSetTargetTimes = item.type === 'client' ? onSetClientTargetTimes : onSetVendorTargetTimes;

            if (!isSelected) return null;

            return (
              <StopItemCard
                key={item.key}
                item={item}
                isLast={idx === arr.length - 1}
                itemStops={itemStops}
                targetTimes={targetTimes}
                onSetTargetTimes={onSetTargetTimes}
                onSetSelected={onSetSelected}
                onOpenPicker={onOpenPicker}
              />
            );
          })
        )}
      </View>

      <AddStopsModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        clients={clients}
        vendors={vendors}
        initialSelectedClients={selectedClients}
        initialSelectedVendors={selectedVendors}
        onSave={(newClients, newVendors) => {
          onSetSelectedClients(newClients);
          onSetSelectedVendors(newVendors);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12, 
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginBottom: 0,
  },
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
});
