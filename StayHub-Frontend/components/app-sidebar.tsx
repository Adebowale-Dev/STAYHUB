'use client';

import * as React from 'react';
import {
    Bell,
    Building2,
    CreditCard,
    DoorOpen,
    FileText,
    Home,
    LayoutDashboard,
    LifeBuoy,
    School,
    Send,
    ShieldCheck,
    Ticket,
    User,
    UserCheck,
    UserCog,
    Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { authAPI } from '@/services/api';
import { NavMain } from '@/components/nav-main';
import { NavProjects } from '@/components/nav-projects';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import { resolveMediaUrl } from '@/lib/media';
import useAuthStore from '@/store/useAuthStore';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

const adminData = {
    navMain: [
        { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
        { title: 'Notifications', url: '/admin/notifications', icon: Bell },
        { title: 'Reports', url: '/admin/reports', icon: FileText },
    ],
    projects: [
        { name: 'Colleges', url: '/admin/colleges', icon: School },
        { name: 'Hostels', url: '/admin/dashboard/hostels', icon: Home },
        { name: 'Rooms', url: '/admin/rooms', icon: DoorOpen },
        { name: 'Porters', url: '/admin/porters', icon: UserCog },
        { name: 'Payments', url: '/admin/payments', icon: CreditCard },
    ],
    navSecondary: [
        { title: 'Support', url: '/admin/reports', icon: LifeBuoy },
        { title: 'Feedback', url: '/admin/notifications', icon: Send },
    ],
};

const studentData = {
    navMain: [
        { title: 'Dashboard', url: '/student/dashboard', icon: LayoutDashboard },
        { title: 'Notifications', url: '/student/notifications', icon: Bell },
    ],
    projects: [
        { name: 'Browse Hostels', url: '/student/hostels', icon: Home },
        { name: 'Reservation', url: '/student/reservation', icon: Ticket },
        { name: 'Payment', url: '/student/payment', icon: CreditCard },
        { name: 'Profile', url: '/student/profile', icon: User },
    ],
    navSecondary: [
        { title: 'Support', url: '/student/settings', icon: LifeBuoy },
        { title: 'Settings', url: '/student/settings', icon: ShieldCheck },
    ],
};

const porterData = {
    navMain: [
        { title: 'Dashboard', url: '/porter/dashboard', icon: LayoutDashboard },
        { title: 'Reports', url: '/porter/reports', icon: FileText },
    ],
    projects: [
        { name: 'Students', url: '/porter/students', icon: Users },
        { name: 'Check-in', url: '/porter/checkin', icon: UserCheck },
        { name: 'Rooms', url: '/porter/rooms', icon: DoorOpen },
        { name: 'Profile', url: '/porter/profile', icon: User },
    ],
    navSecondary: [
        { title: 'Support', url: '/porter/settings', icon: LifeBuoy },
        { title: 'Settings', url: '/porter/settings', icon: ShieldCheck },
    ],
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const sidebarData = user?.role === 'admin'
        ? adminData
        : user?.role === 'student'
            ? studentData
            : porterData;

    const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U';
    const profilePath = user?.role === 'student'
        ? '/student/profile'
        : user?.role === 'porter'
            ? '/porter/profile'
            : '/admin/dashboard';
    const settingsPath = user?.role === 'student'
        ? '/student/settings'
        : user?.role === 'porter'
            ? '/porter/settings'
            : '/admin/dashboard';

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

    return (
        <Sidebar variant="inset" collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Building2 className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">StayHub</span>
                                    <span className="truncate text-xs capitalize">{user?.role || 'platform'}</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={sidebarData.navMain} />
                <NavProjects projects={sidebarData.projects} />
                <NavSecondary items={sidebarData.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser
                    user={{
                        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User',
                        email: user?.email || 'No email',
                        avatar: resolveMediaUrl(user?.profilePicture),
                        initials,
                        profilePath,
                        settingsPath,
                        onLogout: handleLogout,
                    }}
                />
            </SidebarFooter>
        </Sidebar>
    );
}
