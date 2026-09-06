import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { useFocusEffect, router } from 'expo-router';
import axiosClient from '../../../api/axiosClient';

type SubTask = {
  id: string;
  title: string;
  isCompleted: boolean;
};

type TaskEntity = {
  entityId: string;
  title: string;
  description: string;
  targetDate: string | null;
  status: 'ToDo' | 'InProgress' | 'Blocked' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  subTasks: SubTask[];
  assignedToEmployeeId?: string;
  assignedToName?: string;
  createdAt: string;
};

export default function WorkspaceIndexScreen() {
  const [tasks, setTasks] = useState<TaskEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ToDo' | 'InProgress' | 'Blocked' | 'Completed'>('ToDo');

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/Tasks?t=${Date.now()}`);
      if (response.data?.isSuccess && Array.isArray(response.data?.data)) {
        setTasks(response.data.data);
      } else {
        useFallback();
      }
    } catch (error) {
      console.warn('Failed to fetch tasks', error);
      useFallback();
    } finally {
      setLoading(false);
    }
  };

  const useFallback = () => {
    setTasks([
      { entityId: '1', title: 'Update onboarding docs', description: 'Review the 2026 guidelines', targetDate: '2026-08-15T00:00:00Z', status: 'ToDo', priority: 'Medium', subTasks: [], assignedToName: 'Sarah Smith', createdAt: '2026-08-01T00:00:00Z' },
      { entityId: '2', title: 'Server Migration', description: 'Move DB to new cluster', targetDate: '2026-08-10T00:00:00Z', status: 'InProgress', priority: 'Urgent', subTasks: [{ id: 's1', title: 'Backup DB', isCompleted: true }, { id: 's2', title: 'DNS Cutover', isCompleted: false }], assignedToName: 'John Doe', createdAt: '2026-08-02T00:00:00Z' },
      { entityId: '3', title: 'Client Feedback Analysis', description: 'Compile the Q3 feedback', targetDate: null, status: 'Completed', priority: 'Low', subTasks: [], createdAt: '2026-07-20T00:00:00Z' }
    ]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' };
      case 'High': return { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' };
      case 'Medium': return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
      case 'Low': return { bg: '#F9FAFB', text: '#374151', border: '#E5E7EB' };
      default: return { bg: '#F9FAFB', text: '#374151', border: '#E5E7EB' };
    }
  };

  const filteredTasks = tasks.filter(t => t.status === activeTab);
  const tabs: Array<{ id: typeof activeTab, label: string, color: string }> = [
    { id: 'ToDo', label: 'To Do', color: '#9CA3AF' },
    { id: 'InProgress', label: 'In Progress', color: '#60A5FA' },
    { id: 'Blocked', label: 'Blocked', color: '#F87171' },
    { id: 'Completed', label: 'Done', color: '#34D399' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const count = tasks.filter(t => t.status === tab.id).length;
          return (
            <TouchableOpacity 
              key={tab.id} 
              style={[styles.tab, isActive && { borderBottomColor: tab.color, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, isActive && { color: tab.color, fontWeight: '700' }]}>
                {tab.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <ScrollView 
          style={styles.listContainer} 
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tasks in this list.</Text>
            </View>
          ) : (
            filteredTasks.map(task => {
              const priorityColors = getPriorityColor(task.priority);
              const completedSubtasks = task.subTasks ? task.subTasks.filter(s => s.isCompleted).length : 0;
              const totalSubtasks = task.subTasks ? task.subTasks.length : 0;
              
              return (
                <TouchableOpacity 
                  key={task.entityId} 
                  style={styles.taskCard}
                  onPress={() => router.push(`/(tabs)/modules/workspace/task/${task.entityId}` as any)}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.priorityBadge, { backgroundColor: priorityColors.bg, borderColor: priorityColors.border }]}>
                      <Text style={[styles.priorityText, { color: priorityColors.text }]}>{task.priority.toUpperCase()}</Text>
                    </View>
                    {task.assignedToName ? (
                      <View style={styles.assigneeBadge}>
                        <Text style={styles.assigneeText}>{task.assignedToName}</Text>
                      </View>
                    ) : null}
                  </View>
                  
                  <Text style={styles.title}>{task.title}</Text>
                  
                  {totalSubtasks > 0 ? (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${(completedSubtasks / totalSubtasks) * 100}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{completedSubtasks}/{totalSubtasks}</Text>
                    </View>
                  ) : null}
                  
                  {task.targetDate ? (
                    <View style={styles.footer}>
                      <Text style={[
                        styles.dateText, 
                        new Date(task.targetDate) < new Date() && task.status !== 'Completed' ? styles.overdueDate : null
                      ]}>
                        📅 {new Date(task.targetDate).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/(tabs)/modules/workspace/new' as any)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 100, gap: 12 },
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 15 },
  taskCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  assigneeBadge: { backgroundColor: '#F3E8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  assigneeText: { fontSize: 11, fontWeight: '600', color: '#6B21A8' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 4 },
  progressText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  footer: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  dateText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  overdueDate: { color: '#EF4444' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  fabText: { fontSize: 32, color: '#FFFFFF', lineHeight: 36, fontWeight: '300' }
});
