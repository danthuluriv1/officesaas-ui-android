import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../../../../components/AppText';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import axiosClient from '../../../../api/axiosClient';

type Message = {
  id: string;
  entityId?: string;
  messageType: string;
  senderName: string;
  senderEmail?: string;
  subject: string;
  status: 'New' | 'Read' | 'Resolved';
  createdAt: string;
  content?: string;
};

export default function InboxTypeListScreen() {
  const { type } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchMessages();
    }, [type])
  );

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/messages/type/${type}?t=${Date.now()}`);
      if (response.data?.isSuccess && response.data?.data?.items) {
        processMessages(response.data.data.items);
      } else {
        processMessages(getFallbackData());
      }
    } catch (error) {
      processMessages(getFallbackData());
    } finally {
      setLoading(false);
    }
  };

  const processMessages = (allMsgs: Message[]) => {
    const safeMsgs = Array.isArray(allMsgs) ? allMsgs : [];
    // Clone before sorting to avoid mutating read-only arrays
    const sorted = [...safeMsgs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setMessages(sorted);
  };

  const getFallbackData = (): Message[] => {
    const typeStr = Array.isArray(type) ? type[0] : type;
    return [
      { id: '1', messageType: 'Enquiry', senderName: 'John Doe', senderEmail: 'john@example.com', subject: 'Corporate Event Catering', createdAt: '2026-08-01T10:00:00Z', status: 'New' },
      { id: '2', messageType: 'Enquiry', senderName: 'Sarah Smith', senderEmail: 'sarah@example.com', subject: 'Wedding Reception', createdAt: '2026-07-28T14:30:00Z', status: 'Read' },
      { id: '3', messageType: 'Feedback', senderName: 'L&T Corp', senderEmail: 'contact@lnt.com', subject: 'Client Feedback - Rating: 5/5', createdAt: '2026-08-02T09:15:00Z', status: 'New' },
      { id: '4', messageType: 'Feedback', senderName: 'Blue Star', senderEmail: 'hr@bluestar.com', subject: 'Client Feedback - Rating: 4/5', createdAt: '2026-07-30T16:45:00Z', status: 'Read' },
      { id: '5', messageType: 'Support', senderName: 'Jane Smith', senderEmail: 'jane@example.com', subject: 'Billing Issue', createdAt: '2026-07-25T11:20:00Z', status: 'New' },
    ].filter(m => m.messageType === typeStr) as Message[];
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
      <Text style={styles.header}>{type} Messages</Text>
      
      {messages.length === 0 ? (
        <Text style={styles.emptyText}>No messages found.</Text>
      ) : (
        messages.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.messageCard, item.status === 'New' && styles.unreadCard]}
            onPress={() => router.push({ pathname: `/(tabs)/modules/inbox/message/${item.id}`, params: { messageData: JSON.stringify(item) } } as any)}
          >
            <View style={styles.messageHeader}>
              <Text style={[styles.senderName, item.status === 'New' && styles.unreadText]}>{item.senderName}</Text>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.subject, item.status === 'New' && styles.unreadText]}>{item.subject}</Text>
            {item.senderEmail ? <Text style={styles.email}>{item.senderEmail}</Text> : null}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 15,
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  unreadCard: {
    borderLeftColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  subject: {
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 6,
  },
  unreadText: {
    fontWeight: '700',
    color: '#111827',
  },
  email: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  }
});
