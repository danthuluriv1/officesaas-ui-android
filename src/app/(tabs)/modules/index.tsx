import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { router, useFocusEffect } from 'expo-router';
import axiosClient from '../../../api/axiosClient';
import { useNotifications } from '../../../context/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import { getItem } from '../../../utils/storage';
import { decodeJwt } from '../../../utils/jwt';

const modules = [
  { id: 'clients', title: 'Clients', description: 'Manage client profiles and details', icon: 'people', color: '#FEE2E2', iconColor: '#B91C1C' },
  { id: 'vendors', title: 'Vendors', description: 'Manage vendor profiles and details', icon: 'business', color: '#FEF08A', iconColor: '#A16207' },
  { id: 'directory', title: 'Staff Directory', description: 'Manage employee profiles and roles', icon: 'id-card', color: '#DBEAFE', iconColor: '#1D4ED8' },
  { id: 'inventory', title: 'Inventory', description: 'Track stock levels and stock items', icon: 'cube', color: '#FEF3C7', iconColor: '#B45309' },
  { id: 'products', title: 'Products', description: 'Manage your product catalog', icon: 'pricetags', color: '#E0E7FF', iconColor: '#4338CA' },
  { id: 'orders', title: 'Orders', description: 'View and manage sales orders', icon: 'cart', color: '#DCFCE7', iconColor: '#15803D' },
  { id: 'finance', title: 'Finance', description: 'Access financial ledgers and accounting', icon: 'wallet', color: '#FCE7F3', iconColor: '#BE185D' },
  { id: 'attendance', title: 'Attendance', description: 'Log time and view attendance records', icon: 'time', color: '#E0F2FE', iconColor: '#0369A1' },
  { id: 'inbox', title: 'Inbox', description: 'View and manage incoming messages', icon: 'mail', color: '#EDE9FE', iconColor: '#6D28D9' },
  { id: 'workspace', title: 'Team Workspace', description: 'Collaborate with your team', icon: 'chatbubbles', color: '#F3E8FF', iconColor: '#7E22CE' },
  { id: 'transportation', title: 'Transportation', description: 'Manage vehicles and optimize delivery paths', icon: 'bus', color: '#DCFCE7', iconColor: '#15803D' },
  { id: 'drivers', title: 'Drivers', description: 'View assigned active routes and navigate', icon: 'navigate', color: '#EFF6FF', iconColor: '#1D4ED8' },
  { id: 'my-office', title: 'My Office', description: 'Manage office profile and settings', icon: 'settings', color: '#E0E7FF', iconColor: '#4338CA' },
  { id: 'documents', title: 'Documents', description: 'Store and search documents', icon: 'document-text', color: '#FEF3C7', iconColor: '#B45309' },
];

export default function ModulesScreen() {
  const [unreadCount, setUnreadCount] = useState(0); // Messages
  const [refreshing, setRefreshing] = useState(false);
  const { refreshNotificationCount } = useNotifications();
  const [userRole, setUserRole] = useState<string>('');
  const [modulePermissions, setModulePermissions] = useState<Record<string, string[]> | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
      refreshNotificationCount();
      loadUserAndPermissions();
    }, [])
  );

  const loadUserAndPermissions = async () => {
    try {
      const token = await getItem('saas_token');
      if (token) {
        const claims = decodeJwt(token);
        if (claims) {
          setUserRole(claims.role);
        }
      }
      const res = await axiosClient.get('/Settings/profile');
      if (res.data?.isSuccess && res.data?.data?.modulePermissions) {
        setModulePermissions(res.data.data.modulePermissions);
      }
    } catch (e) {
      console.warn('Failed to load permissions', e);
    }
  };

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
    await Promise.all([fetchUnreadCount(), refreshNotificationCount(), loadUserAndPermissions()]);
    setRefreshing(false);
  }, []);

  const visibleModules = modules.filter(mod => {
    if (userRole === 'SuperAdmin' || userRole === 'OfficeAdmin') return true;
    if (!modulePermissions) return true; // Show all if permissions not loaded yet to prevent flickering empty state
    const roleMap: Record<string, string> = {
      SuperAdmin: '0', OfficeAdmin: '1', OperationsManager: '2', FinanceManager: '3', 
      HRManager: '4', SalesManager: '5', TransportationManager: '6', Driver: '7', StandarEmployee: '8'
    };
    const roleKey = roleMap[userRole] || userRole;
    const roleModules = modulePermissions[roleKey] || [];
    
    // Map shortcut IDs back to their actual module IDs for permission checking
    let moduleId = mod.id;
    if (moduleId === 'directory') moduleId = 'employees';
    if (moduleId === 'my-office') moduleId = 'myoffice';
    
    return roleModules.includes(moduleId);
  });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      
      <View style={styles.grid}>
        {visibleModules.map((mod) => (
          <TouchableOpacity
            key={mod.id}
            style={styles.card}
            onPress={() => router.push(`/(tabs)/modules/${mod.id}` as any)}
          >
            <View style={[styles.iconContainer, { backgroundColor: mod.color }]}>
              <Ionicons name={mod.icon as any} size={28} color={mod.iconColor} />
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
