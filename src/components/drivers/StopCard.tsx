import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../AppText';

interface StopCardProps {
  stop: any;
  routeId: string;
  color: string;
  updatingStop: string | null;
  onNavigate: () => void;
  onUpdateStatus: (routeId: string, sequenceNumber: number, status: string) => void;
}

export function StopCard({ stop, routeId, color, updatingStop, onNavigate, onUpdateStatus }: StopCardProps) {
  const isCompleted = stop.status === 'Completed';
  const isSkipped = stop.status === 'Skipped';
  const stopKey = `${routeId}_${stop.sequenceNumber}`;
  const isUpdating = updatingStop === stopKey;

  return (
    <View style={styles.stopCard}>
      <View style={styles.stopCardBody}>
        <View style={[
          styles.stopNumContainer, 
          { backgroundColor: isCompleted ? '#10B981' : isSkipped ? '#EF4444' : color }
        ]}>
          <Text style={styles.stopNumText}>
            {isCompleted ? '✓' : isSkipped ? '✗' : stop.sequenceNumber}
          </Text>
        </View>
        <View style={styles.stopDetails}>
          <Text style={[styles.stopNameText, (isCompleted || isSkipped) && styles.strikeText]}>
            {stop.stopName}
          </Text>
          <Text style={styles.stopAddressText}>{stop.addressText}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {stop.estimatedArrivalTime ? (
              <Text style={styles.stopArrivalBadge}>🕒 Est. Arrival: {stop.estimatedArrivalTime}</Text>
            ) : null}
            {stop.targetTime ? (
              <Text style={styles.stopTargetBadge}>🎯 Target: {stop.targetTime}</Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.stopActions}>
        <TouchableOpacity 
          style={[styles.navBtn, { borderColor: color }]} 
          onPress={onNavigate}
        >
          <Text style={[styles.navBtnText, { color: color }]}>Navigate</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.statusBtn, 
            isCompleted ? styles.statusBtnCompleted : isSkipped ? styles.statusBtnSkipped : styles.statusBtnPending
          ]}
          onPress={() => onUpdateStatus(routeId, stop.sequenceNumber, stop.status)}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.statusBtnText}>
              {isCompleted ? 'Completed' : isSkipped ? 'Skipped' : 'Mark Visited'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stopCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  stopCardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stopNumContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stopNumText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  stopDetails: {
    flex: 1,
  },
  stopNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  strikeText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  stopAddressText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  stopTargetBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  stopArrivalBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  stopActions: {
    flexDirection: 'row',
    gap: 12,
  },
  navBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  navBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  statusBtn: {
    flex: 2,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnPending: {
    backgroundColor: '#111827',
  },
  statusBtnCompleted: {
    backgroundColor: '#10B981',
  },
  statusBtnSkipped: {
    backgroundColor: '#EF4444',
  },
  statusBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
