import axiosClient from './axiosClient';
import type { DailyAttendanceDashboardResponse, AttendanceRecordDto } from '../types';

export const AttendanceService = {
  getDashboardByDate: async (dateStr: string) => {
    const response = await axiosClient.get('/Attendance/by-date', {
      params: { date: dateStr, pageNumber: 1, pageSize: 100 }
    });
    return response.data?.data as DailyAttendanceDashboardResponse;
  },

  logManualAttendance: async (payload: any[]) => {
    return await axiosClient.post('/Attendance/admin-manual-log', payload);
  }
};
