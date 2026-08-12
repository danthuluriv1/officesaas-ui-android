import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { router, useFocusEffect } from 'expo-router';
import axiosClient from '../../../api/axiosClient';

export default function InboxIndexScreen() {
  const [types, setTypes] = useState<string[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchMessages();
    }, [])
  );

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const ts = Date.now();
      const [typesRes, countRes] = await Promise.all([
        axiosClient.get(`/messages/types?t=${ts}`).catch(() => null),
        axiosClient.get(`/messages/unread-count?t=${ts}`).catch(() => null)
      ]);

      if (typesRes?.data?.isSuccess && Array.isArray(typesRes.data.data)) {
        setTypes(typesRes.data.data);
      } else {
        setTypes(['Enquiry', 'Feedback', 'Support']);
      }

      if (countRes?.data?.isSuccess && countRes.data.data) {
        setTotalUnread(countRes.data.data.totalCount || 0);
        setCategoryCounts(countRes.data.data.categoryCounts || {});
      } else {
        setTotalUnread(0);
        setCategoryCounts({});
      }
    } catch (error) {
      console.warn("Failed to fetch inbox data, using fallback", error);
      setTypes(['Enquiry', 'Feedback', 'Support']);
      setTotalUnread(0);
      setCategoryCounts({});
    } finally {
      setLoading(false);
    }
  };

  const getGroupConfig = (type: string) => {
    const configs: Record<string, { color: string, icon: string }> = {
      Enquiry: { color: '#FEF3C7', icon: '📝' },
      Feedback: { color: '#E0E7FF', icon: '⭐' },
      Support: { color: '#FEE2E2', icon: '🔧' },
      Other: { color: '#F3F4F6', icon: '📁' }
    };
    return configs[type] || configs.Other;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inbox Overview</Text>
        {totalUnread > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalUnread} Unread</Text>
          </View>
        ) : null}
      </View>

      {types.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Inbox is completely clear! 🎉</Text>
        </View>
      ) : (
        types.map((t) => {
          const type = t || 'Other';
          const config = getGroupConfig(type);
          return (
            <TouchableOpacity
              key={type}
              style={styles.card}
              onPress={() => router.push(`/(tabs)/modules/inbox/${type}` as any)}
            >
              <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
                <Text style={styles.icon}>{config.icon}</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{type}</Text>
                  {categoryCounts[type] > 0 && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{categoryCounts[type]}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardDesc}>View all {type.toLowerCase()} messages</Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
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
  },
  badge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: '#DBEAFE', // Light blue
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryBadgeText: {
    color: '#2563EB', // Brand primary blue
    fontSize: 12,
    fontWeight: '700',
  }
});
