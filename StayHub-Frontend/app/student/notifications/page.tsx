'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, CheckCircle2, AlertCircle, Info, TriangleAlert, ArrowRight, } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
interface StudentNotification {
    _id: string;
    type: 'warning' | 'info' | 'error' | 'success';
    title?: string;
    message: string;
    createdAt?: string;
    destination?: string;
    read?: boolean;
}
const getNotificationVisuals = (type: StudentNotification['type']) => {
    switch (type) {
        case 'success':
            return {
                icon: CheckCircle2,
                iconClassName: 'text-emerald-600',
                badgeClassName: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            };
        case 'error':
            return {
                icon: AlertCircle,
                iconClassName: 'text-red-600',
                badgeClassName: 'bg-red-50 text-red-700 border-red-200',
            };
        case 'warning':
            return {
                icon: TriangleAlert,
                iconClassName: 'text-amber-600',
                badgeClassName: 'bg-amber-50 text-amber-700 border-amber-200',
            };
        default:
            return {
                icon: Info,
                iconClassName: 'text-sky-600',
                badgeClassName: 'bg-sky-50 text-sky-700 border-sky-200',
            };
    }
};
const formatTimestamp = (value?: string) => {
    if (!value)
        return 'Now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return 'Now';
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};
export default function StudentNotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<StudentNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [markingAll, setMarkingAll] = useState(false);
    useEffect(() => {
        loadNotifications();
    }, []);
    const loadNotifications = async () => {
        setLoading(true);
        try {
            const response = await studentAPI.getNotifications();
            const nextNotifications = response.data?.data || [];
            setNotifications(Array.isArray(nextNotifications) ? nextNotifications : []);
        }
        catch (error) {
            console.error('Failed to load notifications:', error);
            setNotifications([]);
        }
        finally {
            setLoading(false);
        }
    };
    const handleOpenNotification = async (notification: StudentNotification) => {
        try {
            if (!notification.read) {
                await studentAPI.markNotificationsRead({ ids: [notification._id] });
                setNotifications((current) => current.map((item) => item._id === notification._id ? { ...item, read: true } : item));
            }
        }
        catch (error) {
            console.error('Failed to update notification state:', error);
        }
        finally {
            router.push(notification.destination || '/student/reservation');
        }
    };
    const handleMarkAllRead = async () => {
        setMarkingAll(true);
        try {
            await studentAPI.markNotificationsRead({ markAll: true });
            setNotifications((current) => current.map((item) => ({ ...item, read: true })));
        }
        catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
        finally {
            setMarkingAll(false);
        }
    };
    const unreadCount = notifications.filter((notification) => !notification.read).length;
    const visibleNotifications = filter === 'unread'
        ? notifications.filter((notification) => !notification.read)
        : notifications;
    if (loading) {
        return (<ProtectedRoute allowedRoles={['student']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>);
    }
    return (<ProtectedRoute allowedRoles={['student']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Notifications
              </h2>
              <p className="text-muted-foreground mt-1">
                Invitation updates, reservation reminders, and profile alerts.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
                All
              </Button>
              <Button variant={filter === 'unread' ? 'default' : 'outline'} onClick={() => setFilter('unread')}>
                Unread ({unreadCount})
              </Button>
              <Button variant="outline" onClick={handleMarkAllRead} disabled={markingAll || unreadCount === 0}>
                <CheckCheck className="mr-2 h-4 w-4"/>
                {markingAll ? 'Marking...' : 'Mark All Read'}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Notifications</CardDescription>
                <CardTitle className="text-2xl">{notifications.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Unread</CardDescription>
                <CardTitle className="text-2xl">{unreadCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Read</CardDescription>
                <CardTitle className="text-2xl">{notifications.length - unreadCount}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>
                {visibleNotifications.length} notification{visibleNotifications.length !== 1 ? 's' : ''} shown
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {visibleNotifications.length === 0 ? (<div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-10 w-10 text-muted-foreground/40 mb-3"/>
                  <p className="text-sm font-medium text-muted-foreground">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    New room invitations and reminders will appear here.
                  </p>
                </div>) : (visibleNotifications.map((notification) => {
            const visuals = getNotificationVisuals(notification.type);
            const Icon = visuals.icon;
            return (<button key={notification._id} type="button" onClick={() => handleOpenNotification(notification)} className="w-full rounded-2xl border border-border bg-background px-4 py-4 text-left transition-all hover:border-primary/30 hover:bg-muted/20">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted ${visuals.iconClassName}`}>
                            <Icon className="h-4 w-4"/>
                          </div>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-foreground">
                                {notification.title || 'Notification'}
                              </p>
                              {!notification.read && (<Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                                  Unread
                                </Badge>)}
                              <Badge variant="outline" className={visuals.badgeClassName}>
                                {notification.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground/80">
                              {formatTimestamp(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center text-sm font-medium text-primary">
                          Open
                          <ArrowRight className="ml-2 h-4 w-4"/>
                        </div>
                      </div>
                    </button>);
        }))}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>);
}
