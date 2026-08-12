import React from 'react';
import { Theme } from '../../theme';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { AppText as Text } from '../AppText';
import { MapViewer } from './MapViewer';
import type { OptimizeResponse, VehicleRoute } from '../../types';
import { AppAlertStatic } from '../ui/AppAlert';

interface RouteResultViewProps {
  routeResult: OptimizeResponse;
  depotCoords: { latitude: number; longitude: number; name: string };
  saving: boolean;
  onSaveRoutes: () => void;
  onReset: () => void;
}

const ROUTE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function RouteResultView({
  routeResult,
  depotCoords,
  saving,
  onSaveRoutes,
  onReset
}: RouteResultViewProps) {
  const launchGoogleMapsNavigation = (route: VehicleRoute) => {
    if (!route.stops.length) return;
    const start = `${depotCoords.latitude},${depotCoords.longitude}`;
    const dest = `${route.stops[route.stops.length - 1].latitude},${route.stops[route.stops.length - 1].longitude}`;
    const waypoints = route.stops.slice(0, -1).map((s: any) => `${s.latitude},${s.longitude}`).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${start}&destination=${dest}&waypoints=${waypoints}&travelmode=driving`;
    Linking.openURL(url).catch(() => AppAlertStatic.alert("Error", "Could not launch Google Maps navigation"));
  };

  return (
    <View style={styles.panel}>
      <View style={styles.resultsCard}>
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

        <View style={styles.mapFrame}>
          <MapViewer routeResult={routeResult} depotCoords={depotCoords} height={350} />
        </View>
      </View>

      {routeResult.routes.map((route, idx) => {
        const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
        return (
          <View key={route.vehicleEntityId} style={styles.routeCard}>
            <View style={styles.routeCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[styles.indicatorBall, { backgroundColor: color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeName}>{route.vehicleName}</Text>
                  {route.suggestedStartTime ? (
                    <Text style={styles.routeStartText}>Suggested Start: {route.suggestedStartTime}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.statsContainer}>
                <Text style={styles.routeStatsDist}>{route.distanceKm} km</Text>
                <Text style={styles.routeStatsCost}>₹{route.estimatedCostINR}</Text>
              </View>
            </View>

            <View style={styles.stopsList}>
              {route.stops.map((stop: any) => (
                <View key={stop.sequenceNumber} style={styles.stopRow}>
                  <View style={[styles.stopNumContainer, { backgroundColor: color }]}>
                    <Text style={styles.stopNumText}>{stop.sequenceNumber}</Text>
                  </View>
                  <View style={styles.stopDetails}>
                    <Text style={styles.stopNameText}>{stop.stopName}</Text>
                    <Text style={styles.stopAddressText}>{stop.addressText}</Text>
                    <View style={styles.badgeRow}>
                      {stop.estimatedArrivalTime ? (
                        <View style={styles.arrivalBadge}>
                          <Text style={styles.arrivalBadgeText}>Est. Arrival: {stop.estimatedArrivalTime}</Text>
                        </View>
                      ) : null}
                      {stop.targetTime ? (
                        <View style={styles.targetBadge}>
                          <Text style={styles.targetBadgeText}>Target: {stop.targetTime}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.navBtn, { borderColor: color, backgroundColor: `${color}10` }]} 
              onPress={() => launchGoogleMapsNavigation(route)}
            >
              <Text style={[styles.navBtnText, { color: color }]}>Launch GPS Navigation</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={styles.resultActions}>
        <TouchableOpacity style={styles.saveBtn} onPress={onSaveRoutes} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save & Dispatch Routes</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
          <Text style={styles.resetBtnText}>Configure New Routes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    paddingTop: 16,
  },
  resultsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  summarySub: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  costBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  costBadgeText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  costBadgeVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#047857',
  },
  mapFrame: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  routeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  indicatorBall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  routeName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
  },
  routeStartText: {
    fontSize: 13,
    color: '#3B82F6',
    marginTop: 2,
    fontWeight: '600',
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  routeStatsDist: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  routeStatsCost: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 2,
  },
  stopsList: {
    marginLeft: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#F3F4F6',
    paddingLeft: 20,
    marginBottom: 20,
  },
  stopRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stopNumContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -33,
    marginTop: 2,
    borderWidth: 2,
    borderColor: '#fff',
  },
  stopNumText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  stopDetails: {
    flex: 1,
  },
  stopNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  stopAddressText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 17,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  targetBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  targetBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  arrivalBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  arrivalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  navBtn: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  navBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  resultActions: {
    gap: 12,
    marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: Theme.colors.primary,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  resetBtn: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#4B5563',
    fontWeight: '700',
    fontSize: 15,
  },
});
