'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Building2, DoorOpen, UserCog, CreditCard, BarChart3, Home, Ticket, User, UserCheck, FileText, Bell, } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/media';
import useAuthStore from '@/store/useAuthStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{
        className?: string;
    }>;
}
const adminNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Notifications', href: '/admin/notifications', icon: Bell },
    { title: 'Colleges', href: '/admin/colleges', icon: Building2 },
    { title: 'Hostels', href: '/admin/dashboard/hostels', icon: Home },
    { title: 'Rooms', href: '/admin/rooms', icon: DoorOpen },
    { title: 'Porters', href: '/admin/porters', icon: UserCog },
    { title: 'Payments', href: '/admin/payments', icon: CreditCard },
    { title: 'Reports', href: '/admin/reports', icon: BarChart3 },
];
const studentNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { title: 'Browse Hostels', href: '/student/hostels', icon: Home },
    { title: 'My Reservation', href: '/student/reservation', icon: Ticket },
    { title: 'Notifications', href: '/student/notifications', icon: Bell },
    { title: 'Payment', href: '/student/payment', icon: CreditCard },
    { title: 'Profile', href: '/student/profile', icon: User },
];
const porterNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/porter/dashboard', icon: LayoutDashboard },
    { title: 'Students', href: '/porter/students', icon: Users },
    { title: 'Check-in', href: '/porter/checkin', icon: UserCheck },
    { title: 'Rooms', href: '/porter/rooms', icon: DoorOpen },
    { title: 'Reports', href: '/porter/reports', icon: FileText },
    { title: 'Profile', href: '/porter/profile', icon: User },
];
interface AppSidebarProps {
    className?: string;
}
export function AppSidebar({ className }: AppSidebarProps) {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const profilePictureUrl = resolveMediaUrl(user?.profilePicture);
    const userDisplayName = user?.firstName || 'User';
    const getNavItems = (): NavItem[] => {
        switch (user?.role) {
            case 'admin':
                return adminNavItems;
            case 'student':
                return studentNavItems;
            case 'porter':
                return porterNavItems;
            default:
                return [];
        }
    };
    const getInitials = () => {
        if (!user)
            return 'U';
        return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    };
    const navItems = getNavItems();
    return (<div className={cn('flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground', className)}>
      
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
            <Building2 className="h-5 w-5 text-white"/>
          </div>
          <span className="text-lg font-bold text-foreground">StayHub</span>
        </Link>
      </div>

      
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
                (item.href !== '/admin/dashboard' &&
                    item.href !== '/student/dashboard' &&
                    item.href !== '/porter/dashboard' &&
                    pathname.startsWith(item.href));
            const Icon = item.icon;
            return (<Link key={item.href} href={item.href} className={cn('group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150', isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}>
                <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-white' : 'text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground')}/>
                <span>{item.title}</span>
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/80"/>}
              </Link>);
        })}
        </div>
      </nav>

      
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
            {profilePictureUrl ? (<AvatarImage src={profilePictureUrl} alt={`${userDisplayName} profile picture`}/>) : null}
            <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </div>);
}
