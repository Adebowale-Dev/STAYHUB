"use client";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
interface StatCardProps {
    icon: LucideIcon;
    iconColor: string;
    iconBgColor: string;
    value: number | string;
    label: string;
    onClick?: () => void;
}
export function StatCard({ icon: Icon, iconColor, iconBgColor, value, label, onClick, }: StatCardProps) {
    return (<Card className={`p-3 border shadow-none ${onClick ? "cursor-pointer hover:shadow-md hover:border-primary/50 transition-all" : ""}`} onClick={onClick}>
      <div className="flex items-center gap-2.5">
        <div className={`p-2 ${iconBgColor} rounded-lg`}>
          <Icon className={`w-4 h-4 ${iconColor}`}/>
        </div>
        <div>
          <p className="text-xl font-semibold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>);
}
