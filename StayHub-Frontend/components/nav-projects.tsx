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

type ProjectItem = {
  name: string;
  url: string;
  icon: LucideIcon;
};

export function NavProjects({ projects }: { projects: ProjectItem[] }) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  if (!projects.length) return null;

  return (
    <SidebarGroup>
      {!isCollapsed && <SidebarGroupLabel>Projects</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {projects.map((project) => {
            const isActive = pathname === project.url || pathname.startsWith(project.url);

            return (
              <SidebarMenuItem key={project.name}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={project.name} className={cn(isCollapsed && "justify-center px-2") as never}>
                  <Link href={project.url}>
                    <project.icon />
                    {!isCollapsed && <span>{project.name}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
