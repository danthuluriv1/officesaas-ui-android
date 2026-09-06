import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export interface DatePickerFieldProps {
  label?: string;
  date?: Date | null;
  placeholder?: string;
  onChange: (date: Date) => void;
}

export function DatePickerField({ label, date, placeholder, onChange }: DatePickerFieldProps) {
  const [show, setShow] = useState(false);

  const handleValueChange = (event: any, selectedDate?: Date) => {
    // On Android, the picker dismisses immediately after selection
    if (Platform.OS === 'android') {
      setShow(false);
    }

    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const handleDismiss = () => {
    setShow(false);
  };

  return (
    <View style={styles.dropdownContainer}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setShow(true)}>
        <Text style={styles.dropdownText}>{date ? date.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) : placeholder || 'Select Date'}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={date || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onValueChange={handleValueChange}
          onDismiss={handleDismiss}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#111827',
  },
});
