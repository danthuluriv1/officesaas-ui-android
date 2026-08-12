import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { AppText as Text } from '../AppText';
import { Badge } from '../ui/Badge';

interface StopItemCardProps {
  item: any; // The consolidated item object
  isLast: boolean;
  itemStops: { id: string; key: string }[];
  targetTimes: Record<string, string>;
  onSetTargetTimes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSetSelected: React.Dispatch<React.SetStateAction<{ id: string; key: string }[]>>;
  onOpenPicker: (id: string, type: 'client' | 'vendor') => void;
}

export function StopItemCard({
  item,
  isLast,
  itemStops,
  targetTimes,
  onSetTargetTimes,
  onSetSelected,
  onOpenPicker,
}: StopItemCardProps) {
  const hasCoords = item.address && !item.address.includes('Missing coordinates');

  return (
    <View style={[styles.itemRow, isLast && { borderBottomWidth: 0 }]}>
      <View style={styles.itemMeta}>
        <View style={styles.titleRow}>
          <Text style={[styles.itemTitle, !hasCoords && styles.disabledText]}>{item.name}</Text>
          <Badge variant={item.type === 'client' ? 'info' : 'danger'}>
            {item.type === 'client' ? 'Client' : 'Vendor'}
          </Badge>
        </View>
        <Text style={styles.itemSubtitle}>
          {hasCoords ? item.address : "Missing coordinates (GPS)"}
        </Text>
      </View>

      <View style={styles.stopsContainer}>
        {itemStops.map((stop, stopIdx) => {
          const curTimeVal = targetTimes[stop.key];
          return (
            <View key={stop.key} style={[styles.timeRow, stopIdx === itemStops.length - 1 && { marginBottom: 0 }]}>
              <Text style={styles.stopLabel}>Stop {stopIdx + 1}</Text>
              
              <View style={styles.inputContainer}>
                {Platform.OS === 'web' ? (
                  <TextInput 
                    style={styles.timeInput}
                    placeholder="11:30 AM"
                    value={curTimeVal || ''}
                    onChangeText={(val) => onSetTargetTimes(prev => ({ ...prev, [stop.key]: val }))}
                  />
                ) : (
                  <TouchableOpacity 
                    style={styles.timePickerBtn}
                    onPress={() => onOpenPicker(stop.key, item.type as any)}
                  >
                    <Text style={[styles.timeText, !curTimeVal && { color: '#9CA3AF' }]}>
                      {curTimeVal || 'Set target time'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ flex: 1 }} />
              
              <TouchableOpacity 
                style={styles.removeBtn}
                onPress={() => onSetSelected(prev => prev.filter(p => p.key !== stop.key))}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  itemMeta: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 16,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  stopsContainer: {
    marginTop: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  stopLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    width: 55,
    paddingLeft: 4,
  },
  inputContainer: {
    width: 110,
    marginHorizontal: 8,
  },
  timeInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 13,
    textAlign: 'center',
  },
  timePickerBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 13,
    color: '#111827',
  },
  removeBtn: {
    padding: 6,
    paddingRight: 8,
  },
  removeBtnText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});
