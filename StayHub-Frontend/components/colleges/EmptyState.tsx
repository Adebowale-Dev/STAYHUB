"use client";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionButton?: {
        label: string;
        icon: LucideIcon;
        onClick: () => void;
    };
}
export function EmptyState({ icon: Icon, title, description, actionButton, }: EmptyStateProps) {
    return (<div className="p-8 text-center">
      <Icon className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50"/>
      <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-xs text-muted-foreground mb-3">{description}</p>
      {actionButton && (<Button onClick={actionButton.onClick} className="h-9">
          <actionButton.icon className="w-3.5 h-3.5 mr-2"/>
          {actionButton.label}
        </Button>)}
    </div>);
}
