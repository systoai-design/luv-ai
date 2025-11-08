import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  gradient?: boolean;
}

export const SectionHeader = ({ 
  title, 
  subtitle, 
  className,
  gradient = true 
}: SectionHeaderProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      <h2 
        className={cn(
          "text-3xl font-bold tracking-tight",
          gradient && "text-gradient-animated"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground text-sm max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
};
