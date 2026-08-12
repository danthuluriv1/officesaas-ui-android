import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../../components/AppText';

interface HubTabProps {
  vehicleCount: number;
  onNavigate: (tab: 'vehicles' | 'optimize') => void;
}

export function HubTab({ vehicleCount, onNavigate }: HubTabProps) {
  return (
    <View style={styles.hub}>
      <Text style={styles.title}>Transportation Control</Text>
      <Text style={styles.subtitle}>Configure fleets, manage daily gas/EV tariffs, and optimize route delivery cost.</Text>

      <TouchableOpacity 
        style={[styles.card, styles.fleetCard]} 
        onPress={() => onNavigate('vehicles')}
        activeOpacity={0.8}
      >
        <View style={styles.cardInfo}>
          <View style={styles.iconContainerBlue}>
            <Text style={styles.cardIcon}>🚚</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Manage Fleet</Text>
            <Text style={styles.cardSub}>{vehicleCount} Vehicles registered</Text>
          </View>
        </View>
        <View style={styles.linkContainer}>
          <Text style={styles.cardLinkBlue}>Update Vehicles & Tariffs →</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.card, styles.optimizeCard]} 
        onPress={() => onNavigate('optimize')}
        activeOpacity={0.8}
      >
        <View style={styles.cardInfo}>
          <View style={styles.iconContainerGreen}>
            <Text style={styles.cardIcon}>🗺️</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Route Optimization</Text>
            <Text style={styles.cardSub}>Build cost-efficient client delivery paths</Text>
          </View>
        </View>
        <View style={styles.linkContainer}>
          <Text style={styles.cardLinkGreen}>Plan routes on Map →</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  hub: {
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 22,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  fleetCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#3B82F6',
  },
  optimizeCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#10B981',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainerBlue: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainerGreen: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardIcon: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 14,
    color: '#6B7280',
  },
  linkContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    marginTop: 4,
  },
  cardLinkBlue: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '600',
  },
  cardLinkGreen: {
    fontSize: 15,
    color: '#059669',
    fontWeight: '600',
  },
});
