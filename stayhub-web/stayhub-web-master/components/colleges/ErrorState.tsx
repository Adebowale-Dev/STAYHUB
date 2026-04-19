"use client";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
interface ErrorStateProps {
    message: string;
    onBack?: () => void;
    backLabel?: string;
}
export function ErrorState({ message, onBack, backLabel = "Go Back", }: ErrorStateProps) {
    return (<div className="p-4">
      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5"/>
        <div>
          <p className="text-xs font-medium text-destructive">Error</p>
          <p className="text-xs text-destructive/80">{message}</p>
        </div>
      </div>
      {onBack && (<Button variant="outline" onClick={onBack} className="mt-4 h-9">
          <ArrowLeft className="w-4 h-4 mr-2"/>
          {backLabel}
        </Button>)}
    </div>);
}
