"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type NavSubItem = {
  title: string;
  url: string;
};

type NavMainItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  items?: NavSubItem[];
};

export function NavMain({ items }: { items: NavMainItem[] }) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarGroup>
      {!isCollapsed && <SidebarGroupLabel>Platform</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              pathname === item.url ||
              (item.url !== "/admin/dashboard" &&
                item.url !== "/student/dashboard" &&
                item.url !== "/porter/dashboard" &&
                pathname.startsWith(item.url));

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className={cn(isCollapsed && "justify-center px-2") as never}>
                  <Link href={item.url}>
                    <item.icon />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                </SidebarMenuButton>
                {!isCollapsed && item.items?.length ? (
                  <div className="ml-9 mt-1 space-y-1">
                    {item.items.map((subItem) => {
                      const subIsActive = pathname === subItem.url;

                      return (
                        <Link
                          key={subItem.title}
                          href={subItem.url}
                          className={cn(
                            "block rounded-lg px-3 py-1.5 text-sm text-sidebar-foreground/65 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            subIsActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                          )}
                        >
                          {subItem.title}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
