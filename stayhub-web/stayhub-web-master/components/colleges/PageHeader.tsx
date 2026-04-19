"use client";
import { ArrowLeft, Building2, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
interface PageHeaderProps {
    icon?: LucideIcon;
    code?: string;
    title: string;
    isActive?: boolean;
    backUrl: string;
    backLabel?: string;
    actionButton?: {
        label: string;
        icon: LucideIcon;
        onClick: () => void;
    };
}
export function PageHeader({ icon: Icon = Building2, code, title, isActive, backUrl, backLabel = "Back", actionButton, }: PageHeaderProps) {
    const router = useRouter();
    return (<div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push(backUrl)} className="h-8">
            <ArrowLeft className="w-4 h-4 mr-1"/>
            {backLabel}
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4 text-primary"/>
              {code && (<span className="font-mono text-xs font-semibold text-primary">
                  {code}
                </span>)}
              {isActive !== undefined && (<Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                  {isActive ? "Active" : "Inactive"}
                </Badge>)}
            </div>
            <h1 className="text-sm md:text-lg font-semibold text-foreground truncate">
              {title}
            </h1>
          </div>
          {actionButton && (<Button onClick={actionButton.onClick} className="h-8 text-xs shrink-0">
              <actionButton.icon className="w-3.5 h-3.5 mr-1"/>
              {actionButton.label}
            </Button>)}
        </div>
      </div>
    </div>);
}
