import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { getUnreadNotificationCount } from '../api/notificationService';

interface NotificationContextType {
  unreadCount: number;
  refreshNotificationCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshNotificationCount: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotificationCount = useCallback(async () => {
    try {
      const response = await getUnreadNotificationCount();
      if (response.isSuccess) {
        setUnreadCount(response.data);
      }
    } catch (e) {
      console.warn('Failed to refresh notification count', e);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshNotificationCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
