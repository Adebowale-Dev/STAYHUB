'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Bell, Search, AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { authAPI, studentAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { resolveMediaUrl } from '@/lib/media';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, } from '@/components/ui/dropdown-menu';
import { AppSidebar } from '@/components/app-sidebar';
import { AnimatedThemeToggler } from '../themetoggler';
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
    const { user, logout } = useAuthStore();
    const profilePictureUrl = resolveMediaUrl(user?.profilePicture);
    const userDisplayName = user?.firstName || 'User';
    const [sidebarOpen, setSidebarOpen] = useState(false);
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
    const handleLogout = async () => {
        try {
            await authAPI.logout();
        }
        catch (error) {
            console.error('Logout error:', error);
        }
        finally {
            logout();
            router.replace('/login');
        }
    };
    const getInitials = () => {
        if (!user)
            return 'U';
        return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    };
    const getProfilePath = () => {
        switch (user?.role) {
            case 'student':
                return '/student/profile';
            case 'porter':
                return '/porter/profile';
            case 'admin':
                return '/admin/profile';
            default:
                return '/profile';
        }
    };
    const getSettingsPath = () => {
        switch (user?.role) {
            case 'student':
                return '/student/settings';
            case 'porter':
                return '/porter/settings';
            case 'admin':
                return '/admin/settings';
            default:
                return '/settings';
        }
    };
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
    return (<div className="flex h-screen overflow-hidden bg-background">
      
      <aside className="hidden lg:block">
        <AppSidebar />
      </aside>

      
      <>
        
        <div className={`fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)}/>

        
        <aside className={`fixed inset-y-0 left-0 z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <AppSidebar />
        </aside>
      </>

      
      <div className="flex flex-1 flex-col overflow-hidden">
        
        <header className="flex h-16 items-center border-b bg-card px-4 lg:px-6 shadow-sm">
          
          <Button variant="ghost" size="sm" className="lg:hidden h-9 w-9 p-0 shrink-0 mr-2" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? (<X className="h-5 w-5"/>) : (<Menu className="h-5 w-5"/>)}
            <span className="sr-only">Toggle menu</span>
          </Button>

          
          <div className="flex-1 flex justify-center">
            <div className="relative hidden sm:flex w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <input type="text" placeholder="Search..." className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"/>
            </div>
          </div>

          
          <div className="flex items-center gap-2 shrink-0">
            <AnimatedThemeToggler />

            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0 rounded-xl hover:bg-accent">
                  <Bell className="h-5 w-5 text-muted-foreground"/>
                  {unreadCount > 0 && (<span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary"/>)}
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
                    <Bell className="h-8 w-8 text-muted-foreground/40 mb-2"/>
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
                            <p className="text-sm font-medium text-foreground whitespace-normal leading-5">
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
                    <Bell className="h-8 w-8 text-muted-foreground/40 mb-2"/>
                    <p className="text-sm font-medium text-muted-foreground">No new notifications</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {user?.role === 'student'
                ? "You're all caught up!"
                : 'Student notifications are enabled here first.'}
                    </p>
                  </div>)}
              </DropdownMenuContent>
            </DropdownMenu>

          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2">
                <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                  {profilePictureUrl ? (<AvatarImage src={profilePictureUrl} alt={`${userDisplayName} profile picture`}/>) : null}
                  <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold leading-none text-foreground">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground mt-0.5 capitalize">
                    {user?.role}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => router.push(getProfilePath())}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => router.push(getSettingsPath())}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </header>

        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>);
}
