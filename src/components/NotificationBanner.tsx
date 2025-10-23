import React, { useState, useEffect } from 'react';
import { X, Bell, Calendar, Users, MessageSquare } from 'lucide-react';
import type { Notification } from '../lib/supabase';

interface NotificationWithRead extends Notification {
  isRead: boolean;
}

const NotificationBanner: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationWithRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentNotification, setCurrentNotification] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Demo notifications
  const demoNotifications = [
   /* {
      id: 'demo-1',
      type: 'news' as const,
      title: 'Bienvenue à l\'ISTM Kinshasa',
      message: 'Découvrez notre institut de formation médicale de référence en RDC.',
      priority: 'high' as const,
      is_active: true,
      created_by: 'demo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'demo-2',
      type: 'event' as const,
      title: 'Journée Portes Ouvertes',
      message: 'Visitez notre campus et découvrez nos programmes de formation.',
      priority: 'medium' as const,
      is_active: true,
      created_by: 'demo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }*/
  ];

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // TODO: Remplacer par votre système de base de données
        console.log('🔧 Utilisation des notifications de démonstration');

        const notificationsWithRead = (data || []).map(notification => ({
          ...notification,
          isRead: false
        }));
        
        setNotifications(demoNotifications.map(notification => ({
          ...notification,
          isRead: false
        })));
      } catch (error) {
        console.warn('⚠️ Erreur de chargement des notifications, utilisation des données de démo:', error);
        
        const notificationsWithRead = demoNotifications.map(notification => ({
          ...notification,
          isRead: false
        }));
        
        setNotifications(notificationsWithRead);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const unreadNotifications = notifications.filter(n => !n.isRead);

  useEffect(() => {
    // Reset currentNotification if it's out of bounds
    if (currentNotification >= unreadNotifications.length && unreadNotifications.length > 0) {
      setCurrentNotification(0);
    }

    if (unreadNotifications.length > 0) {
      const interval = setInterval(() => {
        setCurrentNotification(prev => 
          prev >= unreadNotifications.length - 1 ? 0 : prev + 1
        );
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [unreadNotifications.length, currentNotification]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'event': return Calendar;
      case 'conference': return Users;
      case 'forum': return MessageSquare;
      case 'class': return Users;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const dismissAll = () => {
    setIsVisible(false);
  };

  if (loading || !isVisible || unreadNotifications.length === 0 || error) return null;

  const notification = unreadNotifications[currentNotification];
  
  // Safety check to prevent undefined access
  if (!notification) return null;
  
  const IconComponent = getIcon(notification.type);

  return (
    <div className={`${getPriorityColor(notification.priority)} text-white py-3 px-4 relative overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
      
      <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-3 flex-1">
          <div className="bg-white/20 p-2 rounded-full">
            <IconComponent className="h-5 w-5" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-sm">{notification.title}</h4>
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                Nouveau
              </span>
            </div>
            <p className="text-sm opacity-90">{notification.message}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {unreadNotifications.length > 1 && (
            <div className="flex space-x-1">
              {unreadNotifications.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentNotification ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
          
          <button
            onClick={() => dismissNotification(notification.id)}
            className="bg-white/20 hover:bg-white/30 p-1 rounded-full transition-colors duration-200"
          >
            <X className="h-4 w-4" />
          </button>
          
          <button
            onClick={dismissAll}
            className="text-xs underline hover:no-underline ml-2"
          >
            Tout masquer
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;