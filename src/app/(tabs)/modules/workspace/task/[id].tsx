import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { AppText as Text } from '../../../../../components/AppText';
import { useLocalSearchParams, Stack } from 'expo-router';
import axiosClient from '../../../../../api/axiosClient';
import { getItem } from '../../../../../utils/storage';
import { AppAlertStatic } from '../../../../../components/ui/AppAlert';

type SubTask = { id: string; title: string; isCompleted: boolean; };

type TaskMessage = { id: string; content: string; postedByName: string; postedByEmployeeId: string; createdAt: string; };

type TaskEntity = {
  entityId: string;
  title: string;
  description: string;
  status: 'ToDo' | 'InProgress' | 'Blocked' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  subTasks: SubTask[];
  assignedToEmployeeId?: string;
  assignedToName?: string;
  targetDate?: string;
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const taskId = Array.isArray(id) ? id[0] : id;
  
  const [task, setTask] = useState<TaskEntity | null>(null);
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [myEmployeeId, setMyEmployeeId] = useState<string | null>(null);
  
  const [newSubtask, setNewSubtask] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [employees, setEmployees] = useState<any[]>([]);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  useEffect(() => {
    fetchData();
    fetchMyId();
  }, [taskId]);

  const fetchMyId = async () => {
    try {
      const token = await getItem('saas_token');
      if (token) {
        // Simple base64 decoding available in Expo environment
        const payloadStr = atob(token.split('.')[1]);
        const payload = JSON.parse(payloadStr);
        setMyEmployeeId(payload.nameid || payload.sub || null);
      }
    } catch (e) {
      console.warn("Could not decode token", e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const ts = Date.now();
    try {
      const [taskRes, msgRes, empRes, userRes] = await Promise.all([
        axiosClient.get(`/Tasks/${taskId}?t=${ts}`),
        axiosClient.get(`/Tasks/${taskId}/messages?t=${ts}`).catch(() => null),
        axiosClient.get('/Employees?PageSize=100').catch(() => null),
        axiosClient.get('/Users?PageSize=100').catch(() => null)
      ]);
      
      if (taskRes.data?.isSuccess) {
        setTask(taskRes.data.data);
      }
      
      if (msgRes?.data?.isSuccess) {
        setMessages(msgRes.data.data || []);
      }
      
      const assigneeMap = new Map<string, any>();
      const employeeLinkedUserIds = new Set<string>();
      if (empRes?.data?.isSuccess) {
        const empList = empRes.data.data.items || empRes.data.data;
        empList.forEach((e: any) => {
          const eId = e.entityId || e.id;
          if (eId) {
            assigneeMap.set(eId, {
              entityId: eId,
              fullName: e.fullName || `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Unnamed Staff'
            });
            if (e.associatedUserEntityId) {
              employeeLinkedUserIds.add(e.associatedUserEntityId);
            }
          }
        });
      }

      if (userRes?.data?.isSuccess) {
        const userList = userRes.data.data.items || userRes.data.data;
        userList.forEach((u: any) => {
          const uId = u.entityId || u.id;
          if (uId && !assigneeMap.has(uId) && !employeeLinkedUserIds.has(uId)) {
            assigneeMap.set(uId, {
              entityId: uId,
              fullName: u.fullName || 'Unnamed User'
            });
          }
        });
      }
      setEmployees(Array.from(assigneeMap.values()));
    } catch (error) {
      console.warn("Error fetching task details", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!task) return;
    try {
      setTask({ ...task, status: newStatus as any });
      await axiosClient.put(`/Tasks/${taskId}/status`, { status: newStatus });
    } catch (error) {
      AppAlertStatic.alert('Error', 'Failed to update status');
      fetchData();
    }
  };

  const assignTask = async (employeeId: string | null) => {
    if (!task) return;
    let empName = null;
    if (employeeId) {
      const emp = employees.find(e => e.entityId === employeeId);
      if (emp) empName = emp.fullName || 'Unnamed Staff';
    }
    try {
      setTask({ ...task, assignedToEmployeeId: employeeId || undefined, assignedToName: empName || undefined });
      await axiosClient.put(`/Tasks/${taskId}/assign`, { 
        assignedToEmployeeId: employeeId || null, 
        assignedToName: empName || null 
      });
      setShowEmployeeModal(false);
    } catch (error) {
      AppAlertStatic.alert('Error', 'Failed to assign task');
      fetchData();
    }
  };

  const toggleSubTask = async (subTaskId: string) => {
    if (!task) return;
    const sub = task.subTasks.find(s => s.id === subTaskId);
    if (!sub) return;
    
    // Optimistic UI
    setTask({
      ...task,
      subTasks: task.subTasks.map(s => s.id === subTaskId ? { ...s, isCompleted: !s.isCompleted } : s)
    });
    
    try {
      await axiosClient.put(`/Tasks/${taskId}/subtasks/${subTaskId}/toggle`, { isCompleted: !sub.isCompleted });
    } catch (error) {
      fetchData(); // revert
    }
  };

  const addSubTask = async () => {
    if (!newSubtask.trim()) return;
    try {
      setSubmitting(true);
      await axiosClient.post(`/Tasks/${taskId}/subtasks`, { title: newSubtask });
      setNewSubtask('');
      fetchData();
    } catch (error) {
      AppAlertStatic.alert('Error', 'Failed to add subtask');
    } finally {
      setSubmitting(false);
    }
  };

  const postMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      setSubmitting(true);
      await axiosClient.post(`/Tasks/${taskId}/messages`, { content: newMessage });
      setNewMessage('');
      fetchData();
    } catch (error) {
      AppAlertStatic.alert('Error', 'Failed to post message');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !task) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  if (!task) {
    return <View style={styles.centerContainer}><Text>Task not found.</Text></View>;
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Header */}
        <View style={styles.card}>
          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.description}>{task.description}</Text>
          
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <TouchableOpacity style={[styles.assigneeContainer, { marginBottom: 0 }]} onPress={() => setShowEmployeeModal(true)}>
              <Text style={styles.assigneeLabel}>Assigned to:</Text>
              <View style={styles.assigneeBadge}>
                <Text style={styles.assigneeText}>{task.assignedToName || 'Unassigned'}</Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.assigneeContainer, { marginBottom: 0 }]}>
              <Text style={styles.assigneeLabel}>Target Date:</Text>
              <View style={[styles.assigneeBadge, { backgroundColor: '#E0F2FE' }]}>
                <Text style={[styles.assigneeText, { color: '#0369A1' }]}>
                  {task.targetDate ? new Date(task.targetDate).toLocaleDateString() : 'Not Set'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statusRow}>
            {(['ToDo', 'InProgress', 'Blocked', 'Completed'] as const).map(s => (
              <TouchableOpacity 
                key={s} 
                style={[styles.statusBtn, task.status === s && styles.statusBtnActive]}
                onPress={() => updateStatus(s)}
              >
                <Text style={[styles.statusText, task.status === s && styles.statusTextActive]}>
                  {s === 'InProgress' ? 'In Progress' : s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Subtasks */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Subtasks</Text>
          {task.subTasks && task.subTasks.length > 0 ? (
            task.subTasks.map(sub => (
              <TouchableOpacity key={sub.id} style={styles.subtaskRow} onPress={() => toggleSubTask(sub.id)}>
                <View style={[styles.checkbox, sub.isCompleted && styles.checkboxActive]}>
                  {sub.isCompleted ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
                <Text style={[styles.subtaskTitle, sub.isCompleted && styles.subtaskCompleted]}>{sub.title}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No subtasks yet.</Text>
          )}
          
          <View style={styles.inputRow}>
            <TextInput 
              style={styles.input} 
              placeholder="Add a subtask..." 
              value={newSubtask}
              onChangeText={setNewSubtask}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addSubTask} disabled={submitting || !newSubtask.trim()}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Discussion</Text>
          {messages.length > 0 ? (
            messages.map(msg => {
              const isMe = msg.postedByEmployeeId === myEmployeeId;
              return (
                <View key={msg.id} style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
                  <View style={[styles.msgBubble, isMe ? styles.msgBubbleRight : styles.msgBubbleLeft]}>
                    <View style={styles.msgHeader}>
                      <Text style={[styles.msgAuthor, isMe && styles.msgAuthorRight]}>{isMe ? 'You' : msg.postedByName}</Text>
                      <Text style={[styles.msgDate, isMe && styles.msgDateRight]}>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                    </View>
                    <Text style={[styles.msgContent, isMe && styles.msgContentRight]}>{msg.content}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No messages yet. Start the discussion!</Text>
          )}

          <View style={styles.inputRow}>
            <TextInput 
              style={styles.input} 
              placeholder="Type a message..." 
              value={newMessage}
              onChangeText={setNewMessage}
            />
            <TouchableOpacity style={styles.addBtn} onPress={postMessage} disabled={submitting || !newMessage.trim()}>
              <Text style={styles.addBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      <Modal visible={showEmployeeModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Assignee</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity 
                style={styles.modalOption}
                onPress={() => assignTask(null)}
              >
                <Text style={styles.modalOptionText}>Unassigned</Text>
              </TouchableOpacity>
              {employees.map(emp => (
                <TouchableOpacity 
                  key={emp.entityId}
                  style={styles.modalOption}
                  onPress={() => assignTask(emp.entityId)}
                >
                  <Text style={styles.modalOptionText}>{emp.fullName || 'Unnamed Staff'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowEmployeeModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  description: { fontSize: 15, color: '#4B5563', marginBottom: 16, lineHeight: 22 },
  statusRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6' },
  statusBtnActive: { backgroundColor: '#2563EB' },
  statusText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  statusTextActive: { color: '#FFFFFF' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxActive: { backgroundColor: '#34D399', borderColor: '#34D399' },
  checkMark: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  subtaskTitle: { fontSize: 15, color: '#374151', flex: 1 },
  subtaskCompleted: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  emptyText: { color: '#9CA3AF', fontSize: 14, fontStyle: 'italic', marginBottom: 12 },
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  input: { flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  addBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  addBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  msgRow: { width: '100%', marginBottom: 8, flexDirection: 'row' },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },
  msgBubble: { padding: 12, borderRadius: 12, maxWidth: '85%' },
  msgBubbleLeft: { backgroundColor: '#F3F4F6', borderBottomLeftRadius: 4 },
  msgBubbleRight: { backgroundColor: '#F3F4F6', borderBottomRightRadius: 4 },
  msgHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, gap: 12 },
  msgAuthor: { fontWeight: '600', fontSize: 12, color: '#374151' },
  msgAuthorRight: { color: '#374151' },
  msgDate: { fontSize: 10, color: '#9CA3AF' },
  msgDateRight: { color: '#9CA3AF' },
  msgContent: { fontSize: 14, color: '#1F2937' },
  msgContentRight: { color: '#1F2937' },
  assigneeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  assigneeLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  assigneeBadge: { backgroundColor: '#F3E8FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  assigneeText: { fontSize: 12, fontWeight: '600', color: '#6B21A8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 12, width: '100%', padding: 16, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  modalOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalOptionText: { fontSize: 16, color: '#374151' },
  modalCloseBtn: { marginTop: 16, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8 },
  modalCloseText: { fontSize: 16, fontWeight: '600', color: '#374151' }
});
