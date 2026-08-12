import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { InventoryService } from '../../../api/inventoryService';
import { Ionicons } from '@expo/vector-icons';
import { AddItemModal } from '../../../components/inventory/AddItemModal';
import { AdjustStockModal } from '../../../components/inventory/AdjustStockModal';
import type { StockLevel } from '../../../types';
import { AppAlertStatic } from '../../../components/ui/AppAlert';
import { Theme } from '../../../theme';

import { useInventory } from '../../../api/hooks/useInventoryQueries';

export default function InventoryScreen() {
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: stockLevels = [], isLoading: loading, isRefetching: refreshing, refetch: fetchData } = useInventory();

  const formatQuantity = (qty: number, unit: string) => {
    const lowerUnit = unit?.toLowerCase() || '';
    if (lowerUnit === 'kg' || lowerUnit === 'liters') {
      return qty.toFixed(3);
    }
    return qty.toString();
  };

  const renderItem = ({ item }: { item: StockLevel }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Ionicons name="layers-outline" size={24} color="#4f46e5" />
      </View>
      <View style={styles.info}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.infoText}>₹{item.unitPrice ? item.unitPrice.toLocaleString('en-IN') : '0'} / {item.unitOfMeasure}</Text>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.cardSubtitle}>{formatQuantity(item.quantityOnHand, item.unitOfMeasure)}</Text>
        <Text style={styles.unitText}>{item.unitOfMeasure}</Text>
      </View>
    </View>
  );

  const filteredStockLevels = stockLevels.filter((item: any) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#EAB308" style={{ marginTop: 20 }} />
      ) : (
        <>
          <View style={styles.searchContainer}>
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search inventory items..." 
              value={searchTerm}
              onChangeText={setSearchTerm}
              clearButtonMode="while-editing"
            />
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setIsAddItemModalOpen(true)}>
              <Text style={styles.actionBtnText}>+ Add Item</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => setIsAdjustModalOpen(true)}>
              <Text style={styles.actionBtnPrimaryText}>± Adjust Stock</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={filteredStockLevels}
            keyExtractor={(item) => item.entityId}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            refreshing={refreshing}
            onRefresh={() => fetchData()}
            ListEmptyComponent={<Text style={styles.emptyText}>No inventory items found.</Text>}
          />
        </>
      )}

      {isAddItemModalOpen && (
        <AddItemModal 
          visible={isAddItemModalOpen}
          onClose={() => setIsAddItemModalOpen(false)}
          onSuccess={fetchData}
        />
      )}

      {isAdjustModalOpen && (
        <AdjustStockModal 
          visible={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          onSuccess={fetchData}
          stockLevels={stockLevels}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  searchInput: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Theme.colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderDark,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnPrimary: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  actionBtnPrimaryText: {
    fontWeight: '600',
    color: '#ffffff',
  },
  actionBtnText: {
    fontWeight: '600',
    color: '#374151',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  unitText: {
    fontSize: 12,
    color: Theme.colors.textTertiary,
    marginTop: 2,
  },
  infoText: {
    fontSize: 14,
    color: Theme.colors.textTertiary,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: Theme.colors.textTertiary,
    marginTop: 20,
  }
});
