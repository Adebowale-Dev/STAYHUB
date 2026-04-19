"use client";
import { Card } from "@/components/ui/card";
interface DeanInfoCardProps {
    deanName: string;
    deanEmail?: string;
}
export function DeanInfoCard({ deanName, deanEmail }: DeanInfoCardProps) {
    return (<Card className="p-3 border shadow-none">
      <div>
        <p className="text-xs text-muted-foreground mb-1">Dean</p>
        <p className="text-sm font-semibold text-foreground">{deanName}</p>
        {deanEmail && (<p className="text-xs text-muted-foreground mt-0.5">{deanEmail}</p>)}
      </div>
    </Card>);
}
