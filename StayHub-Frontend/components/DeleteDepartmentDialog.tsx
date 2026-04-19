"use client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
interface DeleteDepartmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    departmentName?: string;
    departmentCode?: string;
    isDeleting?: boolean;
}
export function DeleteDepartmentDialog({ open, onOpenChange, onConfirm, departmentName, departmentCode, isDeleting = false, }: DeleteDepartmentDialogProps) {
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive"/>
            Confirm Deletion
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this college/department?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm font-medium text-destructive mb-1">
              {departmentName || "Unknown"}
            </p>
            {departmentCode && (<p className="text-xs text-muted-foreground font-mono">
                Code: {departmentCode}
              </p>)}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            This action cannot be undone. All associated data will be permanently
            removed.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? (<>
                <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                Deleting...
              </>) : ("Delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
