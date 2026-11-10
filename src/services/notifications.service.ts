import { api } from './api.service';

export interface UserNotification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  operationId: number | null;
  createdAt: string;
}

export interface UserNotificationsResponse {
  notifications: UserNotification[];
  unreadCount: number;
}

export const notificationsService = {
  getMine: async (): Promise<UserNotificationsResponse> => {
    const response = await api.get<UserNotificationsResponse>('/notifications');
    return response.data;
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    await api.patch(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
};
