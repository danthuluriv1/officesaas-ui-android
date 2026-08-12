import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Linking, Dimensions } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import axiosClient from '../../../api/axiosClient';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { AppAlertStatic } from '../../../components/ui/AppAlert';

interface Vehicle {
  entityId: string;
  name: string;
  licensePlate: string;
  mileagePerLiter: number;
  fuelType: string;
  isAvailable: boolean;
}

interface Client {
  entityId: string;
  companyName: string;
  address: {
    addressLine1: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
}

interface RouteStop {
  sequenceNumber: number;
  stopName: string;
  latitude: number;
  longitude: number;
  addressText: string;
}

interface VehicleRoute {
  vehicleEntityId: string;
  vehicleName: string;
  estimatedCostINR: number;
  distanceKm: number;
  stops: RouteStop[];
}

interface OptimizeResponse {
  totalCostINR: number;
  totalDistanceKm: number;
  routes: VehicleRoute[];
}

const ROUTE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function RoutingScreen() {
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Selection states
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [fuelCost, setFuelCost] = useState('105'); // ₹105 per liter default (Hyderabad average)

  // Result state
  const [routeResult, setRouteResult] = useState<OptimizeResponse | null>(null);
  const [depot, setDepot] = useState<{ latitude: number; longitude: number; name: string } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [vehiclesRes, clientsRes] = await Promise.all([
        axiosClient.get('/Vehicles'),
        axiosClient.get('/Clients')
      ]);

      const vehiclesList = vehiclesRes.data.data || [];
      const clientsList = clientsRes.data.data?.items || clientsRes.data.data || [];

      setVehicles(vehiclesList);
      setClients(clientsList);

      // Auto-select active/available items
      setSelectedVehicles(vehiclesList.filter((v: Vehicle) => v.isAvailable).map((v: Vehicle) => v.entityId));
      setSelectedClients(clientsList.filter((c: Client) => c.address?.latitude && c.address?.longitude).map((c: Client) => c.entityId));
    } catch (e) {
      console.warn("Failed to load initial routing parameters", e);
      AppAlertStatic.alert("Error", "Failed to retrieve vehicles or client directory lists.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (selectedVehicles.length === 0) {
      AppAlertStatic.alert("Required", "Please select at least one active vehicle.");
      return;
    }
    if (selectedClients.length === 0) {
      AppAlertStatic.alert("Required", "Please select at least one client location.");
      return;
    }

    try {
      setOptimizing(true);
      const response = await axiosClient.post('/Routing/optimize', {
        activeVehicleEntityIds: selectedVehicles,
        fuelCostPerLiter: parseFloat(fuelCost) || 105,
        clientEntityIds: selectedClients
      });

      if (response.data.isSuccess) {
        const result = response.data.data as OptimizeResponse;
        setRouteResult(result);

        // Find starting depot (always the first element in stops, let's fall back to Hyderabad central coordinates if not found)
        const firstRoute = result.routes[0];
        if (firstRoute && firstRoute.stops.length > 0) {
          // Depot coordinates (default depot isn't explicitly returned unless we fetch office, but we can extrapolate or use central coords)
          // In the algorithm, depot is start/end. Since we start there, let's default depot to Hyderabad center coordinates if not explicitly marked.
          setDepot({
            latitude: 17.4485, // Madhapur center
            longitude: 78.3741,
            name: "Office Depot"
          });
        }
      } else {
        AppAlertStatic.alert("Optimization Failed", response.data.message || "An error occurred during calculation.");
      }
    } catch (e: any) {
      console.warn("Failed optimizing path", e);
      AppAlertStatic.alert("Error", e.response?.data?.message || "Verify coordinate values on client addresses.");
    } finally {
      setOptimizing(false);
    }
  };

  const launchGoogleMapsNavigation = (route: VehicleRoute) => {
    if (!route.stops.length) return;

    const start = depot ? `${depot.latitude},${depot.longitude}` : `17.4485,78.3741`;
    const dest = `${route.stops[route.stops.length - 1].latitude},${route.stops[route.stops.length - 1].longitude}`;
    
    // Format waypoints: middle stops separated by pipe
    const waypoints = route.stops
      .slice(0, -1)
      .map(s => `${s.latitude},${s.longitude}`)
      .join('|');

    const url = `https://www.google.com/maps/dir/?api=1&origin=${start}&destination=${dest}&waypoints=${waypoints}&travelmode=driving`;
    
    Linking.openURL(url).catch(() => {
      AppAlertStatic.alert("Error", "Could not open Google Maps app.");
    });
  };

  const toggleVehicle = (id: string) => {
    setSelectedVehicles(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleClient = (id: string) => {
    setSelectedClients(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading delivery nodes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Route map details */}
      {routeResult ? (
        <View style={styles.resultContainer}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryTitle}>Optimization Complete</Text>
              <Text style={styles.summarySub}>Total Distance: {routeResult.totalDistanceKm} km</Text>
            </View>
            <View style={styles.costBadge}>
              <Text style={styles.costBadgeText}>Est. Cost</Text>
              <Text style={styles.costBadgeVal}>₹{routeResult.totalCostINR}</Text>
            </View>
          </View>

          {/* Map Preview */}
          <View style={styles.mapFrame}>
            <MapView
              provider={PROVIDER_DEFAULT}
              style={styles.map}
              initialRegion={{
                latitude: depot?.latitude || 17.4485,
                longitude: depot?.longitude || 78.3741,
                latitudeDelta: 0.15,
                longitudeDelta: 0.15,
              }}
            >
              {/* Depot Marker */}
              <Marker
                coordinate={{ latitude: depot?.latitude || 17.4485, longitude: depot?.longitude || 78.3741 }}
                title="Office Depot"
                pinColor="#EF4444"
              />

              {/* Client Markers & Route Polylines */}
              {routeResult.routes.map((route, routeIdx) => {
                const color = ROUTE_COLORS[routeIdx % ROUTE_COLORS.length];
                const coordinates = [
                  { latitude: depot?.latitude || 17.4485, longitude: depot?.longitude || 78.3741 },
                  ...route.stops.map(s => ({ latitude: s.latitude, longitude: s.longitude })),
                  { latitude: depot?.latitude || 17.4485, longitude: depot?.longitude || 78.3741 }
                ];

                return (
                  <React.Fragment key={route.vehicleEntityId}>
                    {/* Polyline Path */}
                    <Polyline
                      coordinates={coordinates}
                      strokeColor={color}
                      strokeWidth={4}
                    />

                    {/* Stop Markers */}
                    {route.stops.map((stop) => (
                      <Marker
                        key={`${route.vehicleEntityId}-${stop.sequenceNumber}`}
                        coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                        title={`${stop.sequenceNumber}. ${stop.stopName}`}
                        description={stop.addressText}
                        pinColor={color}
                      />
                    ))}
                  </React.Fragment>
                );
              })}
            </MapView>
          </View>

          {/* Individual Vehicle Routes */}
          {routeResult.routes.map((route, idx) => {
            const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
            return (
              <View key={route.vehicleEntityId} style={styles.routeCard}>
                <View style={styles.routeCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.indicatorBall, { backgroundColor: color }]} />
                    <Text style={styles.routeName}>{route.vehicleName}</Text>
                  </View>
                  <Text style={styles.routeStats}>{route.distanceKm} km · ₹{route.estimatedCostINR}</Text>
                </View>

                {/* List of stops */}
                <View style={styles.stopsList}>
                  {route.stops.map(stop => (
                    <View key={stop.sequenceNumber} style={styles.stopRow}>
                      <View style={styles.stopNumContainer}>
                        <Text style={styles.stopNumText}>{stop.sequenceNumber}</Text>
                      </View>
                      <View style={styles.stopDetails}>
                        <Text style={styles.stopNameText}>{stop.stopName}</Text>
                        <Text style={styles.stopAddressText}>{stop.addressText}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <TouchableOpacity 
                  style={[styles.navBtn, { borderColor: color }]} 
                  onPress={() => launchGoogleMapsNavigation(route)}
                >
                  <Text style={[styles.navBtnText, { color: color }]}>Launch GPS Navigation</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          <TouchableOpacity style={styles.resetBtn} onPress={() => setRouteResult(null)}>
            <Text style={styles.resetBtnText}>Configure New Routes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.configContainer}>
          <Text style={styles.sectionHeader}>1. Set Daily Parameters</Text>
          
          <View style={styles.inputCard}>
            <Text style={styles.label}>Fuel Cost (₹ / Liter)</Text>
            <TextInput
              style={styles.fuelInput}
              keyboardType="numeric"
              value={fuelCost}
              onChangeText={setFuelCost}
              placeholder="e.g. 105"
            />
          </View>

          <Text style={styles.sectionHeader}>2. Select Available Vehicles</Text>
          <View style={styles.listCard}>
            {vehicles.map(v => (
              <TouchableOpacity 
                key={v.entityId} 
                style={[styles.itemRow, selectedVehicles.includes(v.entityId) && styles.itemRowActive]}
                onPress={() => toggleVehicle(v.entityId)}
              >
                <View style={styles.itemMeta}>
                  <Text style={styles.itemTitle}>{v.name}</Text>
                  <Text style={styles.itemSubtitle}>{v.licensePlate} · {v.mileagePerLiter} km/L</Text>
                </View>
                <View style={[styles.checkbox, selectedVehicles.includes(v.entityId) && styles.checkboxActive]} />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionHeader}>3. Select Clients for Delivery</Text>
          <View style={styles.listCard}>
            {clients.map(c => {
              const hasCoords = c.address?.latitude && c.address?.longitude;
              return (
                <TouchableOpacity 
                  key={c.entityId} 
                  disabled={!hasCoords}
                  style={[
                    styles.itemRow, 
                    selectedClients.includes(c.entityId) && styles.itemRowActive,
                    !hasCoords && styles.itemRowDisabled
                  ]}
                  onPress={() => toggleClient(c.entityId)}
                >
                  <View style={styles.itemMeta}>
                    <Text style={[styles.itemTitle, !hasCoords && styles.disabledText]}>{c.companyName}</Text>
                    <Text style={styles.itemSubtitle}>
                      {hasCoords ? `${c.address.addressLine1}, ${c.address.city}` : "Missing coordinates (GPS)"}
                    </Text>
                  </View>
                  {hasCoords ? (
                    <View style={[styles.checkbox, selectedClients.includes(c.entityId) && styles.checkboxActive]} />
                  ) : (
                    <Text style={styles.warningMarker}>⚠️</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity 
            style={styles.optimizeBtn} 
            onPress={handleOptimize}
            disabled={optimizing}
          >
            {optimizing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.optimizeBtnText}>Optimize Delivery Paths</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4B5563',
  },
  configContainer: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  fuelInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemRowActive: {
    backgroundColor: '#EFF6FF',
  },
  itemRowDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  itemMeta: {
    flex: 1,
    marginRight: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  checkboxActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  warningMarker: {
    fontSize: 16,
  },
  optimizeBtn: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  optimizeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  summarySub: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  costBadge: {
    alignItems: 'flex-end',
  },
  costBadgeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  costBadgeVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
  },
  mapFrame: {
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  routeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
    marginBottom: 12,
  },
  indicatorBall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  routeStats: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  stopsList: {
    gap: 12,
    marginBottom: 16,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stopNumContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stopNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  stopDetails: {
    flex: 1,
  },
  stopNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  stopAddressText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  navBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  resetBtn: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 8,
  },
  resetBtnText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '600',
  },
});
