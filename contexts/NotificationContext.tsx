import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationComponentProps {
  notification: Notification;
  onDismiss: () => void;
}

const ICONS: Record<NotificationType, React.ReactElement> = {
  success: <CheckCircle className="text-brand-profit" size={24} />,
  error: <XCircle className="text-brand-loss" size={24} />,
  info: <Info className="text-brand-accent" size={24} />,
};

const NotificationComponent: React.FC<NotificationComponentProps> = ({ notification, onDismiss }) => {
  const { t } = useTranslation();
  
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icon = ICONS[notification.type];

  return (
    <div
      className="relative flex items-start gap-3 w-full max-w-sm p-4 rounded-xl bg-brand-surface border border-brand-border shadow-soft-lg backdrop-blur-lg animate-scale-in"
      role="alert"
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 text-sm font-medium text-brand-text-primary pr-6">
        {notification.message}
      </div>
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 rounded-full text-brand-text-secondary hover:bg-black/10 dark:hover:bg-white/10"
        aria-label={t('cycleAlert.dismiss')}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    const newNotification = { id: new Date().getTime(), message, type };
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed top-5 right-5 z-[100] space-y-3 w-full max-w-sm">
        {notifications.map(notification => (
          <NotificationComponent 
            key={notification.id} 
            notification={notification} 
            onDismiss={() => removeNotification(notification.id)} 
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};