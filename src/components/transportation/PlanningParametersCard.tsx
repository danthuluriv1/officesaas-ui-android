import React from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { AppText as Text } from '../AppText';
import { DatePickerField } from '../ui/DatePickerField';
import { Card } from '../ui/Card';

interface PlanningParametersCardProps {
  selectedRouteDate: string;
  onSetSelectedRouteDate: (date: string) => void;
  stopBufferMinutes: string;
  onSetStopBufferMinutes: (mins: string) => void;
}

export function PlanningParametersCard({
  selectedRouteDate,
  onSetSelectedRouteDate,
  stopBufferMinutes,
  onSetStopBufferMinutes,
}: PlanningParametersCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.container}>
        <View style={styles.dateCol}>
          <DatePickerField
            label="Target Dispatch Date"
            date={new Date(selectedRouteDate)}
            onChange={(date) => {
              const dateString = date.toISOString().split('T')[0];
              onSetSelectedRouteDate(dateString);
            }}
          />
        </View>
        
        <View style={styles.bufferCol}>
          <Text style={styles.bufferInputLabel}>Service Buffer (mins)</Text>
          <TextInput
            style={styles.bufferInput}
            keyboardType="numeric"
            value={stopBufferMinutes}
            onChangeText={onSetStopBufferMinutes}
            placeholder="15"
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 20,
  },
  container: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  dateCol: {
    flex: 1,
  },
  bufferCol: {
    flex: 1,
  },
  bufferInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  bufferInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
  },
});
