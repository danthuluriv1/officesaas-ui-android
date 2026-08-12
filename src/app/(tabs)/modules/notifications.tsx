import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { useFocusEffect, router } from 'expo-router';
import { getMyNotifications, markNotificationAsRead, NotificationEntity } from '../../../api/notificationService';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = async (pageNumber: number, isRefresh: boolean = false) => {
    try {
      const response = await getMyNotifications(pageNumber, 20);
      if (response.isSuccess) {
        if (isRefresh) {
          setNotifications(response.data.items);
        } else {
          setNotifications(prev => [...prev, ...response.data.items]);
        }
        setHasMore(pageNumber < response.data.totalPages);
      }
    } catch (e) {
      console.warn("Failed to fetch notifications", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchNotifications(1, true);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchNotifications(1, true);
  };

  const onLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  };

  const handleNotificationPress = async (notification: NotificationEntity) => {
    if (!notification.isRead) {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.entityId === notification.entityId ? { ...n, isRead: true } : n));
      try {
        await markNotificationAsRead(notification.entityId);
      } catch (e) {
        console.warn("Failed to mark as read", e);
        // Revert on failure
        setNotifications(prev => prev.map(n => n.entityId === notification.entityId ? { ...n, isRead: false } : n));
      }
    }

    // Navigate based on type
    if (notification.referenceId) {
      if (notification.type === 1) { // Task
        router.push(`/(tabs)/modules/workspace/task/${notification.referenceId}`);
      } else if (notification.type === 2) { // Order
        router.push(`/(tabs)/modules/orders/${notification.referenceId}`);
      } else if (notification.type === 3) { // Message
        router.push(`/(tabs)/modules/inbox/message/${notification.referenceId}`);
      }
    }
  };

  const renderIcon = (type: number) => {
    switch (type) {
      case 1: return <Text style={{fontSize: 24}}>📋</Text>; // Task
      case 2: return <Text style={{fontSize: 24}}>🛒</Text>; // Order
      case 3: return <Text style={{fontSize: 24}}>💬</Text>; // Message
      case 4: return <Text style={{fontSize: 24}}>⚠️</Text>; // Alert
      default: return <Text style={{fontSize: 24}}>ℹ️</Text>; // System
    }
  };

  const renderItem = ({ item }: { item: NotificationEntity }) => (
    <TouchableOpacity 
      style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        {renderIcon(item.type)}
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading && page === 1 ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.entityId}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  unreadText: {
    color: '#111827',
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    marginLeft: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
