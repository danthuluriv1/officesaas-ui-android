import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProductService } from '../../../api/productService';
import { AddProductModal } from '../../../components/products/AddProductModal';
import type { ProductSummary } from '../../../types';

export default function ProductsScreen() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const data = await ProductService.getProducts(1, 50, searchTerm);
      setProducts(data);
    } catch (err) {
      console.warn('Failed to fetch products data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [searchTerm]);

  const renderItem = ({ item }: { item: ProductSummary }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push({ pathname: '/(tabs)/modules/products/[id]', params: { id: item.entityId } } as any)}
    >
      <View style={styles.avatar}>
        <Ionicons name="cube-outline" size={24} color="#059669" />
      </View>
      <View style={styles.info}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <View style={styles.badgesRow}>
          {item.sku ? <View style={styles.badge}><Text style={styles.badgeText}>SKU: {item.sku}</Text></View> : null}
          {item.category ? <View style={styles.badge}><Text style={styles.badgeText}>{item.category}</Text></View> : null}
        </View>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.priceText}>₹{item.sellingPrice}</Text>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search products..." 
          value={searchTerm}
          onChangeText={setSearchTerm}
          clearButtonMode="while-editing"
        />
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => setIsModalOpen(true)}>
          <Text style={styles.actionBtnPrimaryText}>+ Add Product</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.entityId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchData(); }}
          ListEmptyComponent={<Text style={styles.emptyText}>No products found.</Text>}
        />
      )}

      {isModalOpen && (
        <AddProductModal 
          visible={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchData}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderWidth: 1,
    borderColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnPrimaryText: {
    fontWeight: '600',
    color: '#ffffff',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    backgroundColor: '#D1FAE5',
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
    flexDirection: 'row',
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  badge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 20,
  }
});
