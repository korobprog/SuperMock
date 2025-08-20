import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface RoleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function RoleCard({ 
  title, 
  description, 
  icon: Icon, 
  selected, 
  onClick,
  className 
}: RoleCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-6 rounded-2xl cursor-pointer transition-all duration-300",
        "border-2 hover:scale-105 active:scale-95",
        "bg-gradient-to-br from-card to-secondary/30",
        "shadow-[0_2px_8px_hsl(var(--border))]",
        selected 
          ? "border-primary bg-gradient-to-br from-primary/5 to-primary/10 shadow-[0_4px_20px_hsl(var(--primary)/20%)]" 
          : "border-border hover:border-primary/30",
        className
      )}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={cn(
          "p-4 rounded-full transition-colors",
          selected 
            ? "bg-primary text-primary-foreground" 
            : "bg-telegram-light-gray text-telegram-gray"
        )}>
          <Icon size={32} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-primary-foreground rounded-full" />
        </div>
      )}
    </div>
  );
}