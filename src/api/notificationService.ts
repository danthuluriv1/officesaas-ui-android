import axiosClient from './axiosClient';

export interface NotificationEntity {
  entityId: string;
  employeeId: string;
  title: string;
  message: string;
  type: number; // NotificationType enum
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PagedList<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  message?: string;
}

export const getMyNotifications = async (pageNumber: number = 1, pageSize: number = 20) => {
  const response = await axiosClient.get<ApiResponse<PagedList<NotificationEntity>>>('/Notifications/my-inbox', {
    params: { pageNumber, pageSize },
  });
  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await axiosClient.get<ApiResponse<number>>('/Notifications/unread-count');
  return response.data;
};

export const markNotificationAsRead = async (id: string) => {
  const response = await axiosClient.put<ApiResponse<boolean>>(`/Notifications/${id}/read`);
  return response.data;
};
