import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { TransportationService } from '../../../api/transportationService';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HubTab } from '../../../components/transportation/HubTab';
import { VehiclesTab } from '../../../components/transportation/VehiclesTab';
import { OptimizeTab } from '../../../components/transportation/OptimizeTab';
import { VehicleFormModal } from '../../../components/transportation/VehicleFormModal';
import { VehicleInfoModal } from '../../../components/transportation/VehicleInfoModal';

import type { Vehicle, OptimizeResponse } from '../../../types';
import { useTransportationData } from '../../../hooks/useTransportationData';
import { useTransportationStore } from '../../../store/transportationStore';

export default function TransportationScreen() {
  const [activeTab, setActiveTab] = useState<'hub' | 'vehicles' | 'optimize'>('hub');
  
  const {
    loading,
    refreshing,
    vehicles,
    clients,
    vendors,
    fuelPrices,
    depotCoords,
    fetchDetails,
    onRefresh
  } = useTransportationData();

  const store = useTransportationStore();

  const [optimizing, setOptimizing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Selected Route Date
  const [selectedRouteDate, setSelectedRouteDate] = useState(new Date().toISOString());

  // Modals
  const [vehicleFormVisible, setVehicleFormVisible] = useState(false);
  const [vehicleInfoVisible, setVehicleInfoVisible] = useState(false);
  const [selectedEditVehicle, setSelectedEditVehicle] = useState<Vehicle | null>(null);

  // Optimization Result
  const [routeResult, setRouteResult] = useState<OptimizeResponse | null>(null);

  useEffect(() => {
    fetchDetails();
  }, []);

  // Update selected edit vehicle if the list updates
  useEffect(() => {
    if (selectedEditVehicle) {
      const current = vehicles.find(v => v.entityId === selectedEditVehicle.entityId);
      if (current) setSelectedEditVehicle(current);
    }
  }, [vehicles]);

  const handleToggleAvailability = async (vehicle: Vehicle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const updated = { ...vehicle, isAvailable: !vehicle.isAvailable };
      await TransportationService.updateVehicle(vehicle.entityId, updated);
      fetchDetails();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update vehicle availability' });
    }
  };

  const handleOptimize = async () => {
    const { selectedVehicles, selectedClients, selectedVendors, clientTargetTimes, vendorTargetTimes, planningParams } = store;

    if (selectedVehicles.length === 0) {
      Toast.show({ type: 'error', text1: 'Required', text2: 'Select at least one available vehicle.' });
      return;
    }
    if (selectedClients.length === 0 && selectedVendors.length === 0) {
      Toast.show({ type: 'error', text1: 'Required', text2: 'Select at least one client or vendor location.' });
      return;
    }

    try {
      setOptimizing(true);
      
      const clientsPayload = selectedClients.map(item => ({
        entityId: item.id,
        targetTime: clientTargetTimes[item.key] || null
      }));

      const vendorsPayload = selectedVendors.map(item => ({
        entityId: item.id,
        targetTime: vendorTargetTimes[item.key] || null
      }));

      const result = await TransportationService.optimizeRoutes({
        activeVehicleEntityIds: selectedVehicles,
        fuelPrices,
        clients: clientsPayload,
        vendors: vendorsPayload,
        stopBufferMinutes: parseInt(planningParams.serviceBuffer) || 15
      });
      setRouteResult(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.message || 'Verify coordinate values on selected addresses.' });
    } finally {
      setOptimizing(false);
    }
  };

  const handleSaveRoutes = async () => {
    if (!routeResult) return;
    try {
      setSaving(true);
      await TransportationService.saveRoutes(routeResult.routes, selectedRouteDate);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Dispatched', text2: 'Routes successfully saved and dispatched to drivers!' });
      setRouteResult(null);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Error', text2: e.message || 'Failed to save routes.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.maxWidthWrapper}>
            {activeTab === 'hub' && (
              <HubTab 
                vehicleCount={vehicles.length} 
                onNavigate={(tab) => setActiveTab(tab)} 
              />
            )}

            {activeTab === 'vehicles' && (
              <VehiclesTab 
                vehicles={vehicles}
                fuelPrices={fuelPrices}
                loading={loading}
                onRefreshFuel={fetchDetails}
                onToggleAvailability={handleToggleAvailability}
                onAddVehicle={() => {
                  setSelectedEditVehicle(null);
                  setVehicleFormVisible(true);
                }}
                onSelectVehicle={(vehicle) => {
                  setSelectedEditVehicle(vehicle);
                  setVehicleInfoVisible(true);
                }}
              />
            )}

            {activeTab === 'optimize' && (
              <OptimizeTab 
                routeResult={routeResult}
                depotCoords={depotCoords}
                vehicles={vehicles}
                clients={clients}
                vendors={vendors}
                selectedRouteDate={selectedRouteDate}
                optimizing={optimizing}
                saving={saving}
                onSetSelectedRouteDate={setSelectedRouteDate}
                onOptimize={handleOptimize}
                onSaveRoutes={handleSaveRoutes}
                onReset={() => setRouteResult(null)}
              />
            )}
          </View>
        </ScrollView>

        {vehicleFormVisible && (
          <VehicleFormModal 
            visible={vehicleFormVisible}
            initialVehicle={selectedEditVehicle}
            onClose={() => {
              setVehicleFormVisible(false);
              if (!vehicleInfoVisible) {
                setSelectedEditVehicle(null);
              }
            }} 
            onSuccess={() => {
              fetchDetails();
              setVehicleFormVisible(false);
              setVehicleInfoVisible(false);
              setSelectedEditVehicle(null);
            }} 
          />
        )}

        {vehicleInfoVisible && (
          <VehicleInfoModal
            visible={vehicleInfoVisible}
            vehicle={selectedEditVehicle}
            onClose={() => {
              setVehicleInfoVisible(false);
              setSelectedEditVehicle(null);
            }}
            onEdit={() => {
              setVehicleFormVisible(true);
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  maxWidthWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    padding: 16,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  }
});
