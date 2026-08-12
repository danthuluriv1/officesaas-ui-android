import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import axiosClient from '../../../../api/axiosClient';
import { AppAlertStatic } from '../../../../components/ui/AppAlert';
import { EmployeeCard } from '../../../../components/directory/EmployeeCard';
import { EmployeeFormModal } from '../../../../components/directory/EmployeeFormModal';
import { Linking } from 'react-native';

interface Employee {
  entityId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: string;
  department: string;
  isActive: boolean;
  phone?: string;
}

export default function DirectoryScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployees = async () => {
    try {
      const response = await axiosClient.get('/Employees', { params: { pageNumber: 1, pageSize: 100 } });
      if (response.data?.isSuccess) {
        setEmployees(response.data.data.items || response.data.data || []);
      }
    } catch (error) {
      console.error(error);
      AppAlertStatic.alert('Error', 'Failed to load staff directory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmployees();
  };

  const filteredEmployees = employees.filter(emp => 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.designation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOnboardSubmit = async (payload: any) => {
    setSubmitting(true);
    try {
      const response = await axiosClient.post('/Employees', payload);
      if (response.data && response.data.isSuccess === false) {
        AppAlertStatic.alert('Error', response.data.message || 'Validation failed');
        setSubmitting(false);
        return;
      }
      AppAlertStatic.alert('Success', 'Employee onboarded successfully!');
      setModalVisible(false);
      fetchEmployees();
    } catch (err: any) {
      AppAlertStatic.alert('Error', err.response?.data?.message || err.message || 'Failed to onboard employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = (item: Employee, action: 'view' | 'call') => {
    if (action === 'view') {
      router.push(`/modules/directory/${item.entityId}` as any);
    } else if (action === 'call') {
      if (item.phone) {
        Linking.openURL(`tel:${item.phone}`);
      } else {
        AppAlertStatic.alert('Not Available', 'This employee does not have a phone number on file.');
      }
    }
  };

  const renderItem = ({ item }: { item: Employee }) => (
    <EmployeeCard 
      item={item}
      onPress={() => handleAction(item, 'view')}
      onAction={handleAction}
      isRefreshing={refreshing}
    />
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.searchInput}
          placeholder="Search employees..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => setModalVisible(true)}>
          <Text style={styles.actionBtnPrimaryText}>+ Onboard Employee</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredEmployees}
        keyExtractor={(item) => item.entityId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text style={styles.emptyText}>No employees found.</Text>}
      />

      <EmployeeFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleOnboardSubmit}
        submitting={submitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnPrimaryText: {
    fontWeight: '700',
    color: '#ffffff',
    fontSize: 16,
  },
  list: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 32,
  }
});
