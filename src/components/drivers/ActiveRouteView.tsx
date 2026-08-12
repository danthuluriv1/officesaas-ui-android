import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { AppText as Text } from '../AppText';
import { MapViewer } from '../transportation/MapViewer';
import { StopCard } from './StopCard';

const ROUTE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

interface ActiveRouteViewProps {
  route: any;
  depotCoords: { latitude: number; longitude: number; name: string };
  refreshing: boolean;
  onRefresh: () => void;
  onBack: () => void;
  updatingStop: string | null;
  onUpdateStatus: (routeId: string, sequenceNumber: number, status: string) => void;
  onNavigate: (route: any, stopIndex: number) => void;
}

export function ActiveRouteView({ 
  route, 
  depotCoords, 
  refreshing, 
  onRefresh, 
  onBack, 
  updatingStop,
  onUpdateStatus,
  onNavigate 
}: ActiveRouteViewProps) {
  const allRoutesResult = { routes: [route] };
  const completedStops = route.stops?.filter((s: any) => s.status === 'Completed').length || 0;

  return (
    <View style={styles.container}>
      <View style={styles.tabHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{route.vehicleName}</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.summaryHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>My Assigned Route</Text>
            <Text style={styles.summarySub}>
              Stops Completed: {completedStops} / {route.stops?.length || 0}
            </Text>
            {route.suggestedStartTime ? (
              <Text style={styles.summaryStartText}>Depart Office: {route.suggestedStartTime}</Text>
            ) : null}
          </View>
          <View style={styles.distBadge}>
            <Text style={styles.distBadgeVal}>{route.distanceKm} km</Text>
          </View>
        </View>

        <View style={styles.mapFrame}>
          <MapViewer routeResult={allRoutesResult} depotCoords={depotCoords} height={300} />
        </View>

        <Text style={styles.sectionTitle}>Route Stops</Text>
        <View style={styles.stopsList}>
          {route.stops?.map((stop: any, idx: number) => (
            <StopCard 
              key={stop.sequenceNumber}
              stop={stop}
              routeId={route.entityId}
              color={ROUTE_COLORS[0]}
              updatingStop={updatingStop}
              onNavigate={() => onNavigate(route, idx)}
              onUpdateStatus={onUpdateStatus}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  summaryStartText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 6,
  },
  distBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  distBadgeVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  mapFrame: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  stopsList: {
    gap: 16,
  },
});
