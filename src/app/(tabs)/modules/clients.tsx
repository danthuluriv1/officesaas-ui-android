import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { router } from 'expo-router';
import { ClientService } from '../../../api/clientService';
import { AddClientModal } from '../../../components/clients/AddClientModal';
import type { ClientBasic } from '../../../types';
import { AppAlertStatic } from '../../../components/ui/AppAlert';
import { Theme } from '../../../theme';

import { useClients } from '../../../api/hooks/useClientQueries';
import { ClientCard } from '../../../components/clients/ClientCard';
import { Linking } from 'react-native';

export default function ClientsScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const { data: clients = [], isLoading: loading, isRefetching: refreshing, refetch: fetchClients } = useClients();

  const filteredClients = clients.filter((client: any) => 
    client.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactPerson1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  const handleAction = (item: ClientBasic, action: 'view' | 'call') => {
    if (action === 'view') {
      router.push({ pathname: '/(tabs)/modules/clients/[id]', params: { id: item.entityId } } as any);
    } else if (action === 'call') {
      Linking.openURL(`tel:${item.phone}`);
    }
  };

  const renderItem = ({ item }: { item: ClientBasic }) => (
    <ClientCard 
      item={item}
      onPress={() => handleAction(item, 'view')}
      onAction={handleAction}
      isRefreshing={refreshing}
    />
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <>
          <View style={styles.searchContainer}>
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search clients..." 
              value={searchTerm}
              onChangeText={setSearchTerm}
              clearButtonMode="while-editing"
            />
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => setModalVisible(true)}>
              <Text style={styles.actionBtnPrimaryText}>+ Add New Client</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={filteredClients}
            keyExtractor={(item) => item.entityId}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            refreshing={refreshing}
            onRefresh={() => fetchClients()}
            ListEmptyComponent={<Text style={styles.emptyText}>No clients found.</Text>}
          />
        </>
      )}

      {modalVisible && (
        <AddClientModal 
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSuccess={fetchClients}
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
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnPrimaryText: {
    fontWeight: '700',
    color: Theme.colors.surface,
    fontSize: 16,
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
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Theme.colors.textTertiary,
  },
  cardBody: {
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
  },
  emptyText: {
    textAlign: 'center',
    color: Theme.colors.textTertiary,
    marginTop: 20,
  }
});
