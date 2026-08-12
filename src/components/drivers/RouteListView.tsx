import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, ListRenderItem } from 'react-native';
import { AppText as Text } from '../AppText';
import { DatePickerField } from '../ui/DatePickerField';
import { DropdownPicker } from '../ui/DropdownPicker';
import { useRouteStore } from '../../store/routeStore';

export interface RouteListViewProps {
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function RouteListView({ refreshing, onRefresh }: RouteListViewProps) {
  const { 
    routes, 
    filterDate, setFilterDate, 
    filterStatus, setFilterStatus, 
    setSelectedRoute 
  } = useRouteStore();

  const statuses = ['All', 'Pending', 'In Progress', 'Completed'];

  // Memoize filtered routes
  const filteredRoutes = useMemo(() => {
    return routes.filter(r => {
      const completed = r.stops?.filter((s: any) => s.status === 'Completed').length || 0;
      const totalStops = r.stops?.length || 1;
      const progressPct = Math.round((completed / totalStops) * 100);

      if (filterStatus === 'Pending' && progressPct > 0) return false;
      if (filterStatus === 'Completed' && progressPct < 100) return false;
      if (filterStatus === 'In Progress' && (progressPct === 0 || progressPct === 100)) return false;

      return true;
    });
  }, [routes, filterStatus]);

  const renderItem: ListRenderItem<any> = ({ item: r }) => {
    const completed = r.stops?.filter((s: any) => s.status === 'Completed').length || 0;
    const totalStops = r.stops?.length || 1;
    const progressPct = Math.round((completed / totalStops) * 100);

    return (
      <TouchableOpacity 
        style={styles.routeRow}
        onPress={() => setSelectedRoute(r)}
        activeOpacity={0.8}
      >
        <View style={styles.routeHeader}>
          <View style={styles.iconContainerBlue}>
            <Text style={{ fontSize: 24 }}>🚚</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleName}>{r.vehicleName}</Text>
            <Text style={styles.routeSubText}>
              {r.stops?.length || 0} stops · {r.distanceKm} km
            </Text>
            {r.suggestedStartTime ? (
              <Text style={styles.routeStartBadge}>Suggested Departure: {r.suggestedStartTime}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
        </View>

        <View style={styles.routeFooter}>
          <Text style={styles.progressText}>{progressPct}% Complete</Text>
          <Text style={styles.viewLink}>Start Route →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      <Text style={styles.title}>Active Routes</Text>
      <Text style={styles.subtitle}>Select a dispatched route for {filterDate} to begin driving and navigating.</Text>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <DatePickerField
            label="Date"
            date={new Date(filterDate)}
            onChange={(d) => setFilterDate(d.toISOString().split('T')[0])}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <DropdownPicker
            label="Status"
            options={statuses.map(s => ({ label: s, value: s }))}
            selectedValue={filterStatus}
            onSelect={setFilterStatus}
          />
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No routes match your filters for {filterDate}.</Text>
    </View>
  );

  return (
    <FlatList
      data={filteredRoutes}
      keyExtractor={(item) => item.entityId}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={styles.container}
      refreshing={refreshing}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
    />
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    paddingTop: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 22,
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 0,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 15,
  },
  routeRow: {
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
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainerBlue: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  routeSubText: {
    fontSize: 14,
    color: '#6B7280',
  },
  routeStartBadge: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  routeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  viewLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});
