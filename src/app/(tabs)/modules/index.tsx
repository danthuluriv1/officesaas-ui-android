import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { router, useFocusEffect } from 'expo-router';
import axiosClient from '../../../api/axiosClient';
import { useNotifications } from '../../../context/NotificationContext';

const modules = [
  { id: 'clients', title: 'Clients', description: 'Manage client profiles and details', icon: '🏢', color: '#FEE2E2' },
  { id: 'vendors', title: 'Vendors', description: 'Manage vendor profiles and details', icon: '🤝', color: '#FEF08A' },
  { id: 'directory', title: 'Staff Directory', description: 'Manage employee profiles and roles', icon: '👤', color: '#DBEAFE' },
  { id: 'inventory', title: 'Inventory', description: 'Track stock levels and stock items', icon: '📦', color: '#FEF3C7' },
  { id: 'products', title: 'Products', description: 'Manage your product catalog', icon: '🏷️', color: '#E0E7FF' },
  { id: 'orders', title: 'Orders', description: 'View and manage sales orders', icon: '🛒', color: '#DCFCE7' },
  { id: 'finance', title: 'Finance', description: 'Access financial ledgers and accounting', icon: '💰', color: '#FCE7F3' },
  { id: 'attendance', title: 'Attendance', description: 'Log time and view attendance records', icon: '⏱️', color: '#E0F2FE' },
  { id: 'inbox', title: 'Inbox', description: 'View and manage incoming messages', icon: '📥', color: '#EDE9FE' },
  { id: 'workspace', title: 'Team Workspace', description: 'Collaborate with your team', icon: '👥', color: '#F3E8FF' },
  { id: 'transportation', title: 'Transportation', description: 'Manage vehicles and optimize delivery paths', icon: '🚚', color: '#DCFCE7' },
  { id: 'drivers', title: 'Drivers', description: 'View assigned active routes and navigate', icon: '🚗', color: '#EFF6FF' },
  { id: 'my-office', title: 'My Office', description: 'Manage office profile and settings', icon: '🏛️', color: '#E0E7FF' },
  { id: 'documents', title: 'Documents', description: 'Store and search documents', icon: '📄', color: '#FEF3C7' },
];

export default function ModulesScreen() {
  const [unreadCount, setUnreadCount] = useState(0); // Messages
  const [refreshing, setRefreshing] = useState(false);
  const { refreshNotificationCount } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
      refreshNotificationCount();
    }, [])
  );

  const fetchUnreadCount = async () => {
    try {
      const response = await axiosClient.get<any>('/Messages/unread-count');
      if (response.data) {
        const payload = response.data.data !== undefined ? response.data.data : response.data;
        const count = typeof payload === 'number' ? payload : (payload?.totalCount || payload?.count || 0);
        setUnreadCount(count);
      }
    } catch (e) {
      console.warn("Failed to fetch unread count", e);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchUnreadCount(), refreshNotificationCount()]);
    setRefreshing(false);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.header}>All Modules</Text>
      <View style={styles.grid}>
        {modules.map((mod) => (
          <TouchableOpacity
            key={mod.id}
            style={styles.card}
            onPress={() => router.push(`/(tabs)/modules/${mod.id}` as any)}
          >
            <View style={[styles.iconContainer, { backgroundColor: mod.color }]}>
              <Text style={styles.icon}>{mod.icon}</Text>
              {mod.id === 'inbox' && unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{mod.title}</Text>
              <Text style={styles.cardDesc}>{mod.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
    marginTop: 8,
  },
  grid: {
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 28,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
