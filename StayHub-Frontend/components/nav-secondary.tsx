"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type SecondaryItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export function NavSecondary({
  items,
  className,
}: {
  items: SecondaryItem[];
  className?: string;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  if (!items.length) return null;

  return (
    <SidebarGroup className={className}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} className={cn(isCollapsed && "justify-center px-2") as never}>
                <Link href={item.url}>
                  <item.icon />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
