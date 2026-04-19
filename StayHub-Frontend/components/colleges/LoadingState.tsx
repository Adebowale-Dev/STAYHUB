"use client";
import { Loader2 } from "lucide-react";
interface LoadingStateProps {
    message?: string;
}
export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
    return (<div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground"/>
      <p className="text-xs text-muted-foreground mt-2">{message}</p>
    </div>);
}
