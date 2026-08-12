import React from 'react';
import { Tabs, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NotificationBell } from '../../components/NotificationBell';
import { NotificationProvider } from '../../context/NotificationContext';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function TabsLayout() {
  usePushNotifications(); // Register device for push on first login
  return (
    <NotificationProvider>
      <Tabs screenOptions={{ 
        tabBarActiveTintColor: '#2563EB', 
        headerShown: true,
        headerRight: () => <NotificationBell />
      }}>
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="modules"
          options={{
            title: 'Modules',
            tabBarLabel: 'Modules',
            tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
          }}
          listeners={{
            tabPress: () => {
              router.replace('/(tabs)/modules');
            },
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
          }}
        />
      </Tabs>
    </NotificationProvider>
  );
}
