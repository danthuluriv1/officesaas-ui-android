import React, { useState } from 'react';
import { Theme } from '../../theme';
import { View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, LayoutAnimation } from 'react-native';
import { AppText as Text } from '../AppText';
import { TransportationService } from '../../api/transportationService';
import type { FuelPrices } from '../../types';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

interface FuelTariffsCardProps {
  currentPrices: FuelPrices;
  onSuccess: () => void;
}

export function FuelTariffsCard({ currentPrices, onSuccess }: FuelTariffsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prices, setPrices] = useState<FuelPrices>(currentPrices);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
    if (expanded) {
      setIsEditing(false); // Reset edit state when collapsing
    }
  };

  const handleUpdate = async () => {
    setSubmitting(true);
    try {
      await TransportationService.saveFuelPrices({
        petrol: parseFloat(prices.petrol as any) || 0,
        diesel: parseFloat(prices.diesel as any) || 0,
        cng: parseFloat(prices.cng as any) || 0,
        ev: parseFloat(prices.ev as any) || 0,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
      setIsEditing(false);
      Toast.show({ type: 'success', text1: 'Updated', text2: 'Fuel tariffs updated successfully.' });
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update fuel tariffs.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!expanded) {
    return (
      <TouchableOpacity style={styles.collapsedCard} onPress={toggleExpand} activeOpacity={0.8}>
        <Text style={styles.collapsedText}>Configure Fuel Tariffs</Text>
        <Text style={styles.chevron}>↓</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.expandedCard}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={toggleExpand} style={styles.titleContainer} activeOpacity={0.8}>
          <Text style={styles.title}>Fuel Tariffs (₹ / Unit)</Text>
          <Text style={styles.chevronUp}>↑</Text>
        </TouchableOpacity>
        
        {!isEditing && (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.grid}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Petrol (₹/L)</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={prices.petrol.toString()}
            onChangeText={(v) => setPrices(p => ({ ...p, petrol: v as any }))}
            keyboardType="numeric"
            editable={isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Diesel (₹/L)</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={prices.diesel.toString()}
            onChangeText={(v) => setPrices(p => ({ ...p, diesel: v as any }))}
            keyboardType="numeric"
            editable={isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>CNG (₹/kg)</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={prices.cng.toString()}
            onChangeText={(v) => setPrices(p => ({ ...p, cng: v as any }))}
            keyboardType="numeric"
            editable={isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>EV (₹/kWh)</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={prices.ev.toString()}
            onChangeText={(v) => setPrices(p => ({ ...p, ev: v as any }))}
            keyboardType="numeric"
            editable={isEditing}
          />
        </View>
      </View>

      {isEditing && (
        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Tariffs</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  collapsedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  collapsedText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 15,
  },
  chevron: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '700',
  },
  expandedCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  chevronUp: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  editText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  inputGroup: {
    width: '47%',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  inputDisabled: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    paddingTop: 10,
    paddingBottom: 10,
    color: '#4B5563',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: Theme.colors.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
