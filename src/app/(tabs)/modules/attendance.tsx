import React, { useState, useEffect } from 'react';
import { Theme } from '../../../theme';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppText as Text } from '../../../components/AppText';
import { AttendanceService } from '../../../api/attendanceService';
import type { AttendanceRecordDto, DailyAttendanceDashboardResponse } from '../../../types';
import { AppAlertStatic } from '../../../components/ui/AppAlert';

interface AttendanceRowState {
  status: 0 | 1 | 3 | null;
  startTime: string;
  endTime: string;
  isModified: boolean;
  isSaving: boolean;
  isSaved: boolean;
}

export default function AdminAttendanceScreen() {
  const [dashboardData, setDashboardData] = useState<DailyAttendanceDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [rowStates, setRowStates] = useState<Record<string, AttendanceRowState>>({});
  const [globalSaving, setGlobalSaving] = useState(false);

  // Date State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchDashboard = async (dateObj: Date) => {
    setLoading(true);
    const dateStr = dateObj.toISOString().substring(0, 10);
    try {
      const data = await AttendanceService.getDashboardByDate(dateStr);
      setDashboardData(data);
      
      const initialStates: Record<string, AttendanceRowState> = {};
      data.records.items.forEach((record) => {
        let st = '';
        let et = '';
        if (record.shiftStartTime) {
          const d = new Date(record.shiftStartTime);
          st = d.toISOString().substring(11, 16);
        }
        if (record.shiftEndTime) {
          const d = new Date(record.shiftEndTime);
          et = d.toISOString().substring(11, 16);
        }

        let normalizedStatus: any = null;
        if (record.status === 0 || (record.status as any) === 'Present') normalizedStatus = 0;
        else if (record.status === 1 || (record.status as any) === 'Absent' || record.status === 2 || (record.status as any) === 'OnLeave') normalizedStatus = 1;
        else if (record.status === 3 || (record.status as any) === 'HalfDay') normalizedStatus = 3;

        initialStates[record.employeeEntityId] = {
          status: normalizedStatus,
          startTime: st,
          endTime: et,
          isModified: false,
          isSaving: false,
          isSaved: record.isLogged
        };
      });
      setRowStates(initialStates);
    } catch (err: any) {
      console.warn('Failed to fetch attendance', err);
      AppAlertStatic.alert('Error', 'Failed to fetch attendance dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(currentDate);
  }, [currentDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard(currentDate);
    setRefreshing(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      if (selectedDate > new Date()) {
        AppAlertStatic.alert('Invalid Date', 'Cannot select a future date.');
        return;
      }
      setCurrentDate(selectedDate);
    }
  };

  const handleStatusChange = (entityId: string, status: 0 | 1 | 3) => {
    setRowStates(prev => {
      const row = prev[entityId];
      let newStart = row.startTime;
      let newEnd = row.endTime;
      
      if (status === 0) { // Present
        if (!newStart) newStart = '09:00';
        if (!newEnd) newEnd = '17:00';
      } else if (status === 3) { // Half Day
        if (!newStart) newStart = '09:00';
        if (!newEnd) newEnd = '13:00';
      } else if (status === 1) { // Absent
        newStart = '';
        newEnd = '';
      }

      return {
        ...prev,
        [entityId]: { ...row, status, startTime: newStart, endTime: newEnd, isModified: true, isSaved: false }
      };
    });
  };

  const markAllPresent = () => {
    if (!dashboardData) return;
    setRowStates(prev => {
      const next = { ...prev };
      dashboardData.records.items.forEach(record => {
        if (!record.isLogged) {
          next[record.employeeEntityId] = {
            ...next[record.employeeEntityId],
            status: 0,
            startTime: next[record.employeeEntityId].startTime || '09:00',
            endTime: next[record.employeeEntityId].endTime || '17:00',
            isModified: true,
            isSaved: false
          };
        }
      });
      return next;
    });
  };

  const saveAllModified = async () => {
    if (!dashboardData) return;
    
    const modifiedRecords = dashboardData.records.items.filter(r => rowStates[r.employeeEntityId]?.isModified);
    if (modifiedRecords.length === 0) return;

    setGlobalSaving(true);
    const dateString = currentDate.toISOString().substring(0, 10);
    
    try {
      const payload = modifiedRecords.map(record => {
        const state = rowStates[record.employeeEntityId];
        let finalStart = null;
        let finalEnd = null;
        
        if (state.startTime) finalStart = new Date(`${dateString}T${state.startTime}:00Z`).toISOString();
        if (state.endTime) finalEnd = new Date(`${dateString}T${state.endTime}:00Z`).toISOString();

        return {
          targetEmployeeEntityId: record.employeeEntityId,
          employeeNameSnapshot: record.employeeName,
          dateString,
          status: state.status,
          shiftStartTime: finalStart,
          shiftEndTime: finalEnd,
          remarks: ''
        };
      });

      setRowStates(prev => {
        const next = { ...prev };
        modifiedRecords.forEach(r => { next[r.employeeEntityId].isSaving = true; });
        return next;
      });

      await AttendanceService.logManualAttendance(payload);
      
      setRowStates(prev => {
        const next = { ...prev };
        modifiedRecords.forEach(r => { 
          next[r.employeeEntityId] = { ...next[r.employeeEntityId], isSaving: false, isSaved: true, isModified: false };
        });
        return next;
      });

      AppAlertStatic.alert('Success', 'Attendance updated successfully.');
      fetchDashboard(currentDate);
    } catch (e) {
      console.warn('Failed to batch save', e);
      setRowStates(prev => {
        const next = { ...prev };
        modifiedRecords.forEach(r => { next[r.employeeEntityId].isSaving = false; });
        return next;
      });
      AppAlertStatic.alert('Error', 'Failed to save attendance records.');
    } finally {
      setGlobalSaving(false);
    }
  };

  const pendingUpdatesCount = Object.values(rowStates).filter(r => r.isModified).length;

  const renderItem = ({ item }: { item: AttendanceRecordDto }) => {
    const row = rowStates[item.employeeEntityId];
    if (!row) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.empName}>{item.employeeName}</Text>
            <Text style={styles.empCode}>{item.employeeCode}</Text>
          </View>
          {row.isSaved ? (
            <Text style={styles.statusLogged}>✓ Logged</Text>
          ) : row.isModified ? (
            <Text style={styles.statusPending}>Pending Save</Text>
          ) : null}
        </View>

        <View style={styles.statusActions}>
          <TouchableOpacity 
            style={[styles.statusBtn, row.status === 0 && styles.statusBtnPresent]} 
            onPress={() => handleStatusChange(item.employeeEntityId, 0)}
          >
            <Text style={[styles.statusBtnText, row.status === 0 && styles.statusBtnTextSelected]}>Present</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statusBtn, row.status === 3 && styles.statusBtnHalf]} 
            onPress={() => handleStatusChange(item.employeeEntityId, 3)}
          >
            <Text style={[styles.statusBtnText, row.status === 3 && styles.statusBtnTextSelected]}>Half Day</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statusBtn, row.status === 1 && styles.statusBtnAbsent]} 
            onPress={() => handleStatusChange(item.employeeEntityId, 1)}
          >
            <Text style={[styles.statusBtnText, row.status === 1 && styles.statusBtnTextSelected]}>Absent</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Attendance Log</Text>
          <Text style={styles.subtitle}>{currentDate.toDateString()}</Text>
        </View>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateBtnText}>Select Date</Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onValueChange={handleDateChange}
          onDismiss={() => setShowDatePicker(Platform.OS === 'ios')}
        />
      )}

      {dashboardData && (
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total</Text>
            <Text style={styles.metricValue}>{dashboardData.totalHeadcount}</Text>
          </View>
          <View style={[styles.metricCard, { borderBottomColor: '#10B981', borderBottomWidth: 3 }]}>
            <Text style={styles.metricLabel}>Present</Text>
            <Text style={styles.metricValue}>{dashboardData.presentCount}</Text>
          </View>
          <View style={[styles.metricCard, { borderBottomColor: '#F59E0B', borderBottomWidth: 3 }]}>
            <Text style={styles.metricLabel}>Half</Text>
            <Text style={styles.metricValue}>{dashboardData.halfDayCount}</Text>
          </View>
          <View style={[styles.metricCard, { borderBottomColor: '#EF4444', borderBottomWidth: 3 }]}>
            <Text style={styles.metricLabel}>Absent</Text>
            <Text style={styles.metricValue}>{dashboardData.absentCount}</Text>
          </View>
        </View>
      )}

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Employee Roster</Text>
        <TouchableOpacity onPress={markAllPresent}>
          <Text style={styles.markAllText}>Mark All Present</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={dashboardData?.records.items || []}
          keyExtractor={(item) => item.employeeEntityId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={<Text style={styles.emptyText}>No employees found.</Text>}
        />
      )}

      {pendingUpdatesCount > 0 && (
        <View style={styles.floatingSaveBar}>
          <View>
            <Text style={styles.floatingSaveTitle}>{pendingUpdatesCount} Unsaved</Text>
            <Text style={styles.floatingSaveSubtitle}>Save changes to log</Text>
          </View>
          <TouchableOpacity 
            style={styles.saveBtn} 
            onPress={saveAllModified} 
            disabled={globalSaving}
          >
            {globalSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save All</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  dateBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  dateBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  metricsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricLabel: {
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100, // Space for floating bar
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  empName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  empCode: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusLogged: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  statusPending: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  statusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  statusBtnTextSelected: {
    color: '#fff',
  },
  statusBtnPresent: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  statusBtnHalf: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  statusBtnAbsent: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  floatingSaveBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 10,
  },
  floatingSaveTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  floatingSaveSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 20,
  },
});
