import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../../../../../components/AppText';
import { useLocalSearchParams, Stack } from 'expo-router';
import axiosClient from '../../../../../api/axiosClient';

type Message = {
  id: string;
  entityId?: string;
  messageType: string;
  senderName: string;
  senderEmail?: string;
  phoneNumber?: string;
  subject: string;
  status: 'New' | 'Read' | 'Resolved';
  createdAt: string;
  content?: string;
};

export default function MessageDetailScreen() {
  const { id, messageData } = useLocalSearchParams();
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessageAndMarkRead();
  }, [id, messageData]);

  const loadMessageAndMarkRead = async () => {
    try {
      setLoading(true);
      // Use the passed data instead of fetching
      if (typeof messageData === 'string') {
        const parsedMessage = JSON.parse(messageData) as Message;
        setMessage(parsedMessage);
        
        // If it's unread ('New'), mark it as read ('Read')
        if (parsedMessage.status === 'New') {
          const targetId = parsedMessage.entityId || parsedMessage.id;
          await axiosClient.put(`/messages/${targetId}/status`, { status: 'Read' });
        }
      } else {
        useFallback();
      }
    } catch (error) {
      console.error("Failed to load message or update status", error);
      useFallback();
    } finally {
      setLoading(false);
    }
  };

  const useFallback = () => {
    const dummy: Message[] = [
      { id: '1', messageType: 'Enquiry', senderName: 'John Doe', senderEmail: 'john@example.com', phoneNumber: '555-0101', subject: 'Corporate Event Catering', content: 'We need catering for 50 people on Friday.', createdAt: '2026-08-01T10:00:00Z', status: 'New' },
      { id: '2', messageType: 'Enquiry', senderName: 'Sarah Smith', senderEmail: 'sarah@example.com', phoneNumber: '555-0102', subject: 'Wedding Reception', content: 'Looking for a vegan menu.', createdAt: '2026-07-28T14:30:00Z', status: 'Read' },
      { id: '3', messageType: 'Feedback', senderName: 'L&T Corp', senderEmail: 'contact@lnt.com', subject: 'Client Feedback - Rating: 5/5', content: 'Organization: L&T Corp\nRating: 5/5\n\nFeedback:\nThe food was absolutely spectacular.', createdAt: '2026-08-02T09:15:00Z', status: 'New' },
      { id: '4', messageType: 'Feedback', senderName: 'Blue Star', senderEmail: 'hr@bluestar.com', subject: 'Client Feedback - Rating: 4/5', content: 'Organization: Blue Star\nRating: 4/5\n\nFeedback:\nGreat service, slightly late.', createdAt: '2026-07-30T16:45:00Z', status: 'Read' },
      { id: '5', messageType: 'Support', senderName: 'Jane Smith', senderEmail: 'jane@example.com', subject: 'Billing Issue', content: 'I have not received my invoice.', createdAt: '2026-07-25T11:20:00Z', status: 'New' },
    ];
    setMessage(dummy.find(m => m.id === id) || null);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!message) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ title: 'Error', headerShown: true }} />
        <Text style={styles.errorText}>Message not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Message Details', headerShown: true }} />
      <View style={styles.headerCard}>
        <Text style={styles.subject}>{message.subject}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.sender}>{message.senderName}</Text>
          <Text style={styles.date}>{new Date(message.createdAt).toLocaleString()}</Text>
        </View>
        {(message.senderEmail || message.phoneNumber) ? (
          <View style={styles.contactInfo}>
            {message.senderEmail ? <Text style={styles.contactText}>📧 {message.senderEmail}</Text> : null}
            {message.phoneNumber ? <Text style={styles.contactText}>📞 {message.phoneNumber}</Text> : null}
          </View>
        ) : null}
      </View>

      <View style={styles.bodyCard}>
        <Text style={styles.bodyText}>{message.content || 'No content provided.'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subject: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sender: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  date: {
    fontSize: 13,
    color: '#6B7280',
  },
  contactInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  contactText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  bodyCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 200,
  },
  bodyText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  }
});
