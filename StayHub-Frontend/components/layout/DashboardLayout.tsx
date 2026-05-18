'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { studentAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, } from '@/components/ui/dropdown-menu';
import { AppSidebar } from '@/components/app-sidebar';
import { AnimatedThemeToggler } from '../themetoggler';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
interface DashboardLayoutProps {
    children: React.ReactNode;
}
interface StudentNotification {
    _id: string;
    type: 'warning' | 'info' | 'error' | 'success';
    icon?: string;
    title?: string;
    message: string;
    createdAt?: string;
    destination?: string;
    read?: boolean;
}
interface NotificationCacheEntry {
    notifications: StudentNotification[];
    unreadCount: number;
    fetchedAt: number;
}
const NOTIFICATION_CACHE_TTL_MS = 10000;
let notificationCache: NotificationCacheEntry | null = null;
const isCacheFresh = (entry: NotificationCacheEntry | null) => Boolean(entry && Date.now() - entry.fetchedAt < NOTIFICATION_CACHE_TTL_MS);
const updateNotificationCache = (notifications: StudentNotification[], unreadCount: number) => {
    notificationCache = {
        notifications,
        unreadCount,
        fetchedAt: Date.now(),
    };
};
const getAlertVisuals = (type: StudentNotification['type']) => {
    switch (type) {
        case 'success':
            return {
                icon: CheckCircle2,
                iconClassName: 'text-emerald-600',
                dotClassName: 'bg-emerald-500',
            };
        case 'error':
            return {
                icon: AlertCircle,
                iconClassName: 'text-red-600',
                dotClassName: 'bg-red-500',
            };
        case 'warning':
            return {
                icon: TriangleAlert,
                iconClassName: 'text-amber-600',
                dotClassName: 'bg-amber-500',
            };
        default:
            return {
                icon: Info,
                iconClassName: 'text-sky-600',
                dotClassName: 'bg-sky-500',
            };
    }
};
export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<StudentNotification[]>([]);
    const [loadingAlerts, setLoadingAlerts] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    useEffect(() => {
        let mounted = true;
        const loadAlerts = async () => {
            if (user?.role !== 'student') {
                setNotifications([]);
                setUnreadCount(0);
                return;
            }
            if (isCacheFresh(notificationCache)) {
                setNotifications(notificationCache?.notifications || []);
                setUnreadCount(notificationCache?.unreadCount || 0);
                return;
            }
            setLoadingAlerts(true);
            try {
                const response = await studentAPI.getNotifications();
                const nextAlerts = response.data?.data || [];
                const nextUnreadCount = response.data?.meta?.unreadCount ?? 0;
                const normalizedAlerts = Array.isArray(nextAlerts) ? nextAlerts : [];
                updateNotificationCache(normalizedAlerts, nextUnreadCount);
                if (mounted) {
                    setNotifications(normalizedAlerts);
                    setUnreadCount(nextUnreadCount);
                }
            }
            catch (error: unknown) {
                if (
                    typeof error === 'object' &&
                    error !== null &&
                    'response' in error &&
                    typeof (error as { response?: { status?: number } }).response === 'object' &&
                    (error as { response?: { status?: number } }).response !== null &&
                    'status' in (error as { response?: { status?: number } }).response!
                ) {
                    const status = (error as { response?: { status?: number } }).response?.status;
                    if (status === 429) {
                        if (mounted && notificationCache) {
                            setNotifications(notificationCache.notifications);
                            setUnreadCount(notificationCache.unreadCount);
                        }
                        return;
                    }
                }
                console.error('Failed to load alerts:', error);
                if (mounted) {
                    setNotifications(notificationCache?.notifications || []);
                    setUnreadCount(notificationCache?.unreadCount || 0);
                }
            }
            finally {
                if (mounted) {
                    setLoadingAlerts(false);
                }
            }
        };
        loadAlerts();
        return () => {
            mounted = false;
        };
    }, [pathname, user?.role]);
    const formatAlertTimestamp = (value?: string) => {
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
    const handleNotificationClick = async (notification: StudentNotification) => {
        try {
            if (user?.role === 'student' && !notification.read) {
                await studentAPI.markNotificationsRead({ ids: [notification._id] });
                setNotifications((current) => {
                    const next = current.map((item) => item._id === notification._id ? { ...item, read: true } : item);
                    updateNotificationCache(next, next.filter((item) => !item.read).length);
                    return next;
                });
                setUnreadCount((current) => Math.max(0, current - 1));
            }
        }
        catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
        finally {
            router.push(notification.destination || '/student/notifications');
        }
    };
    const handleMarkAllRead = async () => {
        try {
            await studentAPI.markNotificationsRead({ markAll: true });
            setNotifications((current) => {
                const next = current.map((item) => ({ ...item, read: true }));
                updateNotificationCache(next, 0);
                return next;
            });
            setUnreadCount(0);
        }
        catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbItems = pathSegments.map((segment, index) => {
        const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const label = segment
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
        return { href, label };
    });
    return (<SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset className="bg-muted/30">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbItems.length > 1 && (<>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href={breadcrumbItems[0].href}>
                        {breadcrumbItems[0].label}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                  </>)}
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {breadcrumbItems[breadcrumbItems.length - 1]?.label || 'Dashboard'}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="ml-auto flex items-center gap-2 px-4">
            <AnimatedThemeToggler />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-xl p-0 hover:bg-accent">
                  <Bell className="h-5 w-5 text-muted-foreground"/>
                  {unreadCount > 0 && (<span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary"/>)}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {user?.role === 'student' ? `${unreadCount} unread` : 'Today'}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {loadingAlerts ? (<div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bell className="mb-2 h-8 w-8 text-muted-foreground/40"/>
                    <p className="text-sm font-medium text-muted-foreground">Loading notifications...</p>
                  </div>) : user?.role === 'student' && notifications.length > 0 ? (<div className="max-h-96 overflow-y-auto">
                    {notifications.slice(0, 6).map((notification) => {
                const visuals = getAlertVisuals(notification.type);
                const Icon = visuals.icon;
                return (<DropdownMenuItem key={notification._id} className="items-start gap-3 py-3" onSelect={() => handleNotificationClick(notification)}>
                          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted ${visuals.iconClassName}`}>
                            <Icon className="h-4 w-4"/>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="whitespace-normal text-sm font-medium leading-5 text-foreground">
                              {notification.message}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <span className={`h-2 w-2 rounded-full ${notification.read ? 'bg-muted-foreground/30' : visuals.dotClassName}`}/>
                              <span>{formatAlertTimestamp(notification.createdAt)}</span>
                            </div>
                          </div>
                        </DropdownMenuItem>);
            })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => router.push('/student/notifications')}>
                      View all notifications
                    </DropdownMenuItem>
                    {unreadCount > 0 && (<DropdownMenuItem onSelect={handleMarkAllRead}>
                        Mark all as read
                      </DropdownMenuItem>)}
                  </div>) : (<div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bell className="mb-2 h-8 w-8 text-muted-foreground/40"/>
                    <p className="text-sm font-medium text-muted-foreground">No new notifications</p>
                    <p className="mt-0.5 text-xs text-muted-foreground/60">
                      {user?.role === 'student'
                ? "You're all caught up!"
                : 'Student notifications are enabled here first.'}
                    </p>
                  </div>)}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
          <div className="mx-auto w-full max-w-[1600px] flex-1">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>);
}
