import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { MoreVertical, LucideIcon } from 'lucide-react';
interface ActionItem {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    separator?: boolean;
}
interface ActionDropdownProps {
    title?: string;
    actions: ActionItem[];
    align?: 'start' | 'end';
    triggerIcon?: LucideIcon;
    triggerVariant?: 'default' | 'outline' | 'ghost' | 'secondary';
}
export function ActionDropdown({ title = 'Actions', actions, align = 'end', triggerIcon: TriggerIcon = MoreVertical, triggerVariant = 'outline', }: ActionDropdownProps) {
    return (<DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={triggerVariant} size="icon">
          <TriggerIcon className="h-4 w-4"/>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        <DropdownMenuLabel>{title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((action, index) => (<div key={index}>
            <DropdownMenuItem onClick={action.onClick}>
              {action.icon && <action.icon className="mr-2 h-4 w-4"/>}
              {action.label}
            </DropdownMenuItem>
            {action.separator && <DropdownMenuSeparator />}
          </div>))}
      </DropdownMenuContent>
    </DropdownMenu>);
}
