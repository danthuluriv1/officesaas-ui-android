import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Linking, ScrollView, RefreshControl } from 'react-native';
import { TransportationService } from '../../../api/transportationService';
import { OfficeService } from '../../../api/officeService';

import { RouteListView } from '../../../components/drivers/RouteListView';
import { ActiveRouteView } from '../../../components/drivers/ActiveRouteView';
import { AppAlertStatic } from '../../../components/ui/AppAlert';

import { useRouteStore } from '../../../store/routeStore';
import { Theme } from '../../../theme';

import { useSavedRoutes } from '../../../api/hooks/useDriverQueries';
import { useOfficeProfile } from '../../../api/hooks/useOfficeQueries';

export default function DriversScreen() {
  const { 
    routes, setRoutes, 
    selectedRoute, setSelectedRoute, 
    filterDate, 
    filterStatus 
  } = useRouteStore();

  const [updatingStop, setUpdatingStop] = useState<string | null>(null);

  const { data: savedRoutesList, isLoading: routesLoading, isRefetching: routesRefreshing, refetch: fetchRoutes } = useSavedRoutes(filterDate);
  const { data: officeProfile } = useOfficeProfile();

  const loading = routesLoading;
  const refreshing = routesRefreshing;

  useEffect(() => {
    if (savedRoutesList) {
      setRoutes(savedRoutesList);
      if (selectedRoute) {
        const updated = savedRoutesList.find((r: any) => r.entityId === selectedRoute.entityId);
        setSelectedRoute(updated || null);
      }
    }
  }, [savedRoutesList]);

  const depotCoords = {
    latitude: officeProfile?.address?.latitude || 17.4485,
    longitude: officeProfile?.address?.longitude || 78.3741,
    name: officeProfile?.name || 'Office Depot'
  };

  const onRefresh = useCallback(() => {
    
    fetchRoutes();
  }, [selectedRoute, filterDate]);

  const handleUpdateStopStatus = async (routeId: string, sequenceNumber: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'Pending' ? 'Completed' : currentStatus === 'Completed' ? 'Skipped' : 'Pending';
    const key = `${routeId}_${sequenceNumber}`;
    try {
      setUpdatingStop(key);
      await TransportationService.completeStop(routeId, sequenceNumber, nextStatus);
      
      // Optimistic update
      const updateRouteLocally = (routeToUpdate: any) => ({
        ...routeToUpdate,
        stops: routeToUpdate.stops.map((stop: any) => 
          stop.sequenceNumber === sequenceNumber ? { ...stop, status: nextStatus } : stop
        )
      });

      setRoutes(prevRoutes => prevRoutes.map(r => r.entityId === routeId ? updateRouteLocally(r) : r));
      
      if (selectedRoute && selectedRoute.entityId === routeId) {
        setSelectedRoute((prevRoute: any) => updateRouteLocally(prevRoute));
      }

    } catch (e: any) {
      AppAlertStatic.alert("Error", "Failed to update stop status.");
      // If optimistic update fails, refetch from server to restore accurate state
      await fetchRoutes();
    } finally {
      setUpdatingStop(null);
    }
  };

  const launchGoogleMapsNavigation = (route: any, stopIndex: number) => {
    const start = stopIndex === 0 
      ? `${depotCoords.latitude},${depotCoords.longitude}`
      : `${route.stops[stopIndex - 1].latitude},${route.stops[stopIndex - 1].longitude}`;
    
    const targetStop = route.stops[stopIndex];
    const dest = `${targetStop.latitude},${targetStop.longitude}`;
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${start}&destination=${dest}&travelmode=driving`;
    Linking.openURL(url).catch(() => AppAlertStatic.alert("Error", "Could not launch Google Maps navigation"));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {selectedRoute ? (
        <ActiveRouteView 
          route={selectedRoute}
          depotCoords={depotCoords}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onBack={() => setSelectedRoute(null)}
          updatingStop={updatingStop}
          onUpdateStatus={handleUpdateStopStatus}
          onNavigate={launchGoogleMapsNavigation}
        />
      ) : (
        <View style={{ flex: 1, padding: 16, paddingTop: 0 }}>
          <RouteListView refreshing={refreshing} onRefresh={onRefresh} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 40,
  }
});
