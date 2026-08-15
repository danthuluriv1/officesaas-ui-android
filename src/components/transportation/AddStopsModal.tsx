import React, { useState, useMemo, useEffect } from 'react';
import { Theme } from '../../theme';
import { View, Modal, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from '../../components/AppText';

interface ClientItem {
  entityId: string;
  companyName: string;
  address: {
    addressLine1: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
}

interface AddStopsModalProps {
  visible: boolean;
  onClose: () => void;
  clients: ClientItem[];
  vendors: ClientItem[];
  initialSelectedClients: { id: string; key: string }[];
  initialSelectedVendors: { id: string; key: string }[];
  onSave: (clients: { id: string; key: string }[], vendors: { id: string; key: string }[]) => void;
}

export function AddStopsModal({
  visible,
  onClose,
  clients,
  vendors,
  initialSelectedClients,
  initialSelectedVendors,
  onSave
}: AddStopsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClients, setSelectedClients] = useState<{ id: string; key: string }[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<{ id: string; key: string }[]>([]);

  // Sync initial state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedClients([...initialSelectedClients]);
      setSelectedVendors([...initialSelectedVendors]);
      setSearchQuery('');
    }
  }, [visible, initialSelectedClients, initialSelectedVendors]);

  const consolidatedItems = useMemo(() => {
    const clientsMapped = clients.filter(c => c.address?.latitude && c.address?.longitude).map(c => ({
      id: c.entityId,
      key: c.entityId,
      name: c.companyName,
      address: `${c.address.addressLine1}, ${c.address.city}`,
      type: 'client' as const
    }));
    
    const vendorsMapped = vendors.filter(v => v.address?.latitude && v.address?.longitude).map(v => ({
      id: v.entityId,
      key: v.entityId,
      name: v.companyName,
      address: `${v.address.addressLine1}, ${v.address.city}`,
      type: 'vendor' as const
    }));

    return [...clientsMapped, ...vendorsMapped];
  }, [clients, vendors]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }
    const lowerQuery = searchQuery.toLowerCase();
    return consolidatedItems.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) || 
      item.address.toLowerCase().includes(lowerQuery)
    );
  }, [consolidatedItems, searchQuery]);

  const handleSave = () => {
    onSave(selectedClients, selectedVendors);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Search Clients / Vendors</Text>
              <Text style={styles.subtitle}>Find and add stops to your route</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Start typing to search..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
          </View>

          <ScrollView 
            style={styles.listContainer} 
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {filteredItems.length === 0 ? (
              <Text style={styles.emptyText}>
                {!searchQuery.trim() ? "Search for clients or vendors to add stops." : "No stops found matching your search."}
              </Text>
            ) : (
              filteredItems.map((item, idx, arr) => {
                const itemStops = item.type === 'client' 
                  ? selectedClients.filter(c => c.id === item.id)
                  : selectedVendors.filter(v => v.id === item.id);
                  
                const isSelected = itemStops.length > 0;
                const onSetSelected = item.type === 'client' ? setSelectedClients : setSelectedVendors;

                return (
                  <View key={item.key} style={[styles.itemRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={styles.itemMeta}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text style={styles.itemTitle}>{item.name}</Text>
                        <View style={[styles.typeBadge, item.type === 'vendor' ? styles.vendorBadge : styles.clientBadge]}>
                          <Text style={[styles.typeBadgeText, item.type === 'vendor' ? styles.vendorBadgeText : styles.clientBadgeText]}>
                            {item.type === 'client' ? 'Client' : 'Vendor'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.itemSubtitle}>{item.address}</Text>
                      {itemStops.length > 1 && (
                        <Text style={{ fontSize: 12, color: '#3B82F6', fontWeight: '600', marginTop: 6 }}>
                          {itemStops.length} Stops Added
                        </Text>
                      )}
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <TouchableOpacity 
                        style={[styles.checkbox, isSelected && styles.checkboxActive]}
                        onPress={() => {
                          if (isSelected) {
                            onSetSelected(prev => prev.filter(p => p.id !== item.id));
                          } else {
                            onSetSelected(prev => [...prev, { id: item.id, key: item.id }]);
                          }
                        }}
                      >
                        {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                      </TouchableOpacity>

                      {isSelected && (
                        <TouchableOpacity 
                          style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}
                          onPress={() => onSetSelected(prev => [...prev, { id: item.id, key: `${item.id}_${Date.now()}` }])}
                        >
                          <Text style={{ color: '#3B82F6', fontSize: 18, fontWeight: '600', lineHeight: 20 }}>+</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.selectionSummary}>
              <Text style={styles.summaryText}>
                {selectedClients.length + selectedVendors.length} Stop(s) Selected
              </Text>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Selections</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '700',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    padding: 16,
  },
  emptyText: {
    padding: 24,
    fontSize: 15,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  itemMeta: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  clientBadge: {
    backgroundColor: '#DBEAFE',
  },
  vendorBadge: {
    backgroundColor: '#FCE7F3',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  clientBadgeText: {
    color: '#1D4ED8',
  },
  vendorBadgeText: {
    color: '#BE185D',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkIcon: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  addStopMiniBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addStopMiniBtnText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectionSummary: {
    flex: 1,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  saveBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
