import React, { useEffect } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { AppText as Text } from './AppText';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNotifications } from '../context/NotificationContext';

export function NotificationBell() {
  const { unreadCount, refreshNotificationCount } = useNotifications();

  // Refresh count whenever this header comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshNotificationCount();
    }, [])
  );

  return (
    <TouchableOpacity onPress={() => router.push('/(tabs)/modules/notifications')} style={styles.container}>
      <Ionicons name={unreadCount > 0 ? 'notifications' : 'notifications-outline'} size={24} color="#374151" />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
    marginRight: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
    zIndex: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
