import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../../components/AppText';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PlanningParametersCard } from './PlanningParametersCard';
import { VehicleSelectorCard } from './VehicleSelectorCard';
import { RouteStopsManager } from './RouteStopsManager';
import { RouteResultView } from './RouteResultView';
import { Button } from '../ui/Button';
import type { Vehicle, OptimizeResponse } from '../../types';
import { useTransportationStore } from '../../store/transportationStore';

interface OptimizeTabProps {
  routeResult: OptimizeResponse | null;
  depotCoords: { latitude: number; longitude: number; name: string };
  vehicles: Vehicle[];
  clients: any[];
  vendors: any[];
  
  // Keep these props as they are managed by the parent's API calls for optimization
  selectedRouteDate: string;
  optimizing: boolean;
  saving: boolean;
  onSetSelectedRouteDate: (val: string) => void;
  onOptimize: () => void;
  onSaveRoutes: () => void;
  onReset: () => void;
}

export function OptimizeTab({
  routeResult,
  depotCoords,
  vehicles,
  clients,
  vendors,
  selectedRouteDate,
  optimizing,
  saving,
  onSetSelectedRouteDate,
  onOptimize,
  onSaveRoutes,
  onReset
}: OptimizeTabProps) {
  const [activePicker, setActivePicker] = useState<{ id: string; type: 'client' | 'vendor' } | null>(null);

  // Zustand state
  const {
    selectedVehicles,
    setSelectedVehicles,
    selectedClients,
    setSelectedClients,
    selectedVendors,
    setSelectedVendors,
    clientTargetTimes,
    setClientTargetTimes,
    vendorTargetTimes,
    setVendorTargetTimes,
    planningParams,
    updatePlanningParams
  } = useTransportationStore();

  const toggleVehicleSelection = (id: string) => {
    setSelectedVehicles(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const parseFormattedTimeToDate = (timeStr?: string): Date => {
    const d = new Date();
    if (!timeStr) return d;
    try {
      const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const ampm = match[3].toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        d.setHours(hours, minutes, 0, 0);
      }
    } catch (e) {}
    return d;
  };

  if (routeResult) {
    return (
      <RouteResultView 
        routeResult={routeResult}
        depotCoords={depotCoords}
        saving={saving}
        onSaveRoutes={onSaveRoutes}
        onReset={onReset}
      />
    );
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Planning Parameters</Text>
      <View style={{ marginBottom: 24 }}>
        <PlanningParametersCard 
          selectedRouteDate={selectedRouteDate}
          onSetSelectedRouteDate={onSetSelectedRouteDate}
          stopBufferMinutes={planningParams.serviceBuffer}
          onSetStopBufferMinutes={(val) => updatePlanningParams({ serviceBuffer: val })}
        />
      </View>

      <Text style={styles.sectionTitle}>Available Vehicles</Text>
      <VehicleSelectorCard 
        vehicles={vehicles}
        selectedVehicles={selectedVehicles}
        onToggleSelection={toggleVehicleSelection}
      />

      <RouteStopsManager 
        clients={clients}
        vendors={vendors}
        selectedClients={selectedClients}
        selectedVendors={selectedVendors}
        clientTargetTimes={clientTargetTimes}
        vendorTargetTimes={vendorTargetTimes}
        onSetSelectedClients={setSelectedClients}
        onSetSelectedVendors={setSelectedVendors}
        onSetClientTargetTimes={setClientTargetTimes}
        onSetVendorTargetTimes={setVendorTargetTimes}
        onOpenPicker={(id, type) => setActivePicker({ id, type })}
      />

      <Button 
        variant="primary"
        size="lg"
        onPress={onOptimize} 
        disabled={optimizing}
        style={styles.optimizeBtn}
      >
        {optimizing ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.optimizeBtnText}>Calculating Optimal Timelines...</Text>
          </View>
        ) : (
          <Text style={styles.optimizeBtnText}>Optimize Routing Timelines</Text>
        )}
      </Button>

      {/* Time picker modal trigger */}
      {activePicker && (
        <DateTimePicker
          value={activePicker.type === 'client' 
            ? parseFormattedTimeToDate(clientTargetTimes[activePicker.id]) 
            : parseFormattedTimeToDate(vendorTargetTimes[activePicker.id])
          }
          mode="time"
          is24Hour={false}
          display="default"
          onValueChange={(event, selectedDate) => {
            setActivePicker(null);
            if (selectedDate) {
              const formattedTime = selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              if (activePicker.type === 'client') {
                setClientTargetTimes(prev => ({ ...prev, [activePicker.id]: formattedTime }));
              } else {
                setVendorTargetTimes(prev => ({ ...prev, [activePicker.id]: formattedTime }));
              }
            }
          }}
          onDismiss={() => setActivePicker(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginBottom: 10,
    marginTop: 14,
  },
  optimizeBtn: {
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  optimizeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

