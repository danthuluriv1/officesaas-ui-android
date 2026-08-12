import React, { useState, useEffect } from 'react';
import { Theme } from '../../../../theme';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppText as Text } from '../../../../components/AppText';
import { router } from 'expo-router';
import axiosClient from '../../../../api/axiosClient';
import { AppAlertStatic } from '../../../../components/ui/AppAlert';

export default function NewTaskScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [subTasks, setSubTasks] = useState<{ title: string; isCompleted: boolean }[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [assignedToEmployeeId, setAssignedToEmployeeId] = useState<string | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axiosClient.get('/Employees?PageSize=100');
      if (res.data?.isSuccess) {
        setEmployees(res.data.data.items || res.data.data);
      }
    } catch (e) {
      console.warn("Failed to fetch employees", e);
    }
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubTasks([...subTasks, { title: newSubtask.trim(), isCompleted: false }]);
      setNewSubtask('');
    }
  };

  const removeSubtask = (index: number) => {
    setSubTasks(subTasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      AppAlertStatic.alert('Validation Error', 'Task title is required.');
      return;
    }
    
    try {
      setLoading(true);
      let assignedToName = null;
      if (assignedToEmployeeId) {
        const emp = employees.find(e => e.entityId === assignedToEmployeeId);
        if (emp) assignedToName = emp.fullName || 'Unnamed Staff';
      }

      const payload = {
        title,
        description,
        targetDate: targetDate ? targetDate.toISOString() : null,
        priority,
        status: 'ToDo',
        subTasks,
        assignedToEmployeeId,
        assignedToName
      };
      
      const response = await axiosClient.post('/Tasks', payload);
      if (response.data?.isSuccess) {
        router.back();
      } else {
        AppAlertStatic.alert('Error', response.data?.message || 'Failed to create task.');
      }
    } catch (error: any) {
      console.warn("Failed to create task", error);
      AppAlertStatic.alert('Error', error.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.formGroup}>
        <Text style={styles.label}>Task Title</Text>
        <TextInput 
          style={styles.input}
          placeholder="e.g. Update Onboarding Guidelines"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput 
          style={[styles.input, styles.textArea]}
          placeholder="Provide more context..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Target Completion Date (Optional)</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={{ color: targetDate ? '#111827' : '#9CA3AF' }}>
            {targetDate ? targetDate.toLocaleDateString() : 'Select Target Date...'}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={targetDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) setTargetDate(selectedDate);
            }}
          />
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Assign To (Optional)</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowEmployeeModal(true)}>
          <Text style={{ color: assignedToEmployeeId ? '#111827' : '#9CA3AF' }}>
            {assignedToEmployeeId 
              ? (employees.find(e => e.entityId === assignedToEmployeeId)?.fullName || 'Selected') 
              : 'Unassigned'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Priority</Text>
        <View style={styles.priorityContainer}>
          {(['Low', 'Medium', 'High', 'Urgent'] as const).map(p => (
            <TouchableOpacity 
              key={p} 
              style={[
                styles.priorityOption, 
                priority === p && styles.prioritySelected,
                priority === p && p === 'Urgent' && { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
                priority === p && p === 'High' && { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
                priority === p && p === 'Medium' && { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
              ]}
              onPress={() => setPriority(p)}
            >
              <Text style={[
                styles.priorityText,
                priority === p && p === 'Urgent' && { color: '#B91C1C' },
                priority === p && p === 'High' && { color: '#C2410C' },
                priority === p && p === 'Medium' && { color: '#1D4ED8' },
                priority === p && p === 'Low' && { color: '#374151' },
              ]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Subtasks</Text>
        {subTasks.map((st, index) => (
          <View key={index} style={styles.subtaskItem}>
            <Text style={styles.subtaskItemText}>• {st.title}</Text>
            <TouchableOpacity onPress={() => removeSubtask(index)}>
              <Text style={styles.removeSubtaskText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        
        <View style={styles.subtaskInputRow}>
          <TextInput 
            style={[styles.input, styles.subtaskInput]}
            placeholder="Add a subtask..."
            value={newSubtask}
            onChangeText={setNewSubtask}
            onSubmitEditing={handleAddSubtask}
          />
          <TouchableOpacity style={styles.addSubtaskBtn} onPress={handleAddSubtask} disabled={!newSubtask.trim()}>
            <Text style={styles.addSubtaskBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Create Task</Text>
        )}
      </TouchableOpacity>

      <Modal visible={showEmployeeModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Assignee</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity 
                style={styles.modalOption}
                onPress={() => { setAssignedToEmployeeId(null); setShowEmployeeModal(false); }}
              >
                <Text style={styles.modalOptionText}>Unassigned</Text>
              </TouchableOpacity>
              {employees.map(emp => (
                <TouchableOpacity 
                  key={emp.entityId}
                  style={styles.modalOption}
                  onPress={() => { setAssignedToEmployeeId(emp.entityId); setShowEmployeeModal(false); }}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    minHeight: 100,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  prioritySelected: {
    borderColor: '#6B7280',
    backgroundColor: '#F3F4F6',
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  subtaskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  subtaskItemText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  removeSubtaskText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  subtaskInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  subtaskInput: {
    flex: 1,
  },
  addSubtaskBtn: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  addSubtaskBtnText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    padding: 16,
    maxHeight: '80%'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  modalOptionText: {
    fontSize: 16,
    color: '#374151'
  },
  modalCloseBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151'
  }
});
