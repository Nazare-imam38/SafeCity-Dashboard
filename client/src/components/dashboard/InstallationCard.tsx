import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { SubProject, SubProjectCard } from "./SubProjectCard";

interface InstallationCardProps {
  title: string;
  percentage: number;
  icon: LucideIcon;
  className?: string;
  color?: "blue" | "green" | "orange" | "purple" | "red" | "yellow" | "primary";
  subProjects?: SubProject[];
  actualProgress?: number;
  plannedProgress?: number;
}

export function InstallationCard({ 
  title, 
  percentage, 
  icon: Icon, 
  className, 
  color = "primary",
  subProjects = [],
  actualProgress,
  plannedProgress
}: InstallationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubProjects = subProjects.length > 0;
  const showDualProgress = actualProgress !== undefined && plannedProgress !== undefined;
  
  // Calculate actual vs planned variance
  const variance = showDualProgress ? actualProgress - plannedProgress : null;
  const getColorClasses = () => {
    switch (color) {
      case "blue": return { 
        icon: "text-blue-600", 
        iconBg: "bg-blue-50 dark:bg-blue-950", 
        border: "border-l-4 border-l-blue-500", 
        progress: "bg-blue-500",
        percentage: "text-blue-600 dark:text-blue-400"
      };
      case "green": return { 
        icon: "text-emerald-600", 
        iconBg: "bg-emerald-50 dark:bg-emerald-950", 
        border: "border-l-4 border-l-emerald-500", 
        progress: "bg-emerald-500",
        percentage: "text-emerald-600 dark:text-emerald-400"
      };
      case "orange": return { 
        icon: "text-orange-600", 
        iconBg: "bg-orange-50 dark:bg-orange-950", 
        border: "border-l-4 border-l-orange-500", 
        progress: "bg-orange-500",
        percentage: "text-orange-600 dark:text-orange-400"
      };
      case "purple": return { 
        icon: "text-purple-600", 
        iconBg: "bg-purple-50 dark:bg-purple-950", 
        border: "border-l-4 border-l-purple-500", 
        progress: "bg-purple-500",
        percentage: "text-purple-600 dark:text-purple-400"
      };
      case "red": return { 
        icon: "text-red-600", 
        iconBg: "bg-red-50 dark:bg-red-950", 
        border: "border-l-4 border-l-red-500", 
        progress: "bg-red-500",
        percentage: "text-red-600 dark:text-red-400"
      };
      case "yellow": return { 
        icon: "text-yellow-600", 
        iconBg: "bg-yellow-50 dark:bg-yellow-950", 
        border: "border-l-4 border-l-yellow-500", 
        progress: "bg-yellow-500",
        percentage: "text-yellow-600 dark:text-yellow-400"
      };
      default: return { 
        icon: "text-primary", 
        iconBg: "bg-primary/10", 
        border: "border-l-4 border-l-primary", 
        progress: "bg-primary",
        percentage: "text-primary"
      };
    }
  };

  const colors = getColorClasses();
  const status = percentage === 100 ? "Completed" : percentage >= 80 ? "Near Complete" : percentage >= 50 ? "In Progress" : "Started";

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 group",
      colors.border,
      "border-r border-t border-b border-border/40 hover:border-border",
      "bg-gradient-to-br from-card to-card/95",
      className
    )}>
      {/* Subtle background gradient */}
      <div className={cn(
        "absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 -mr-12 -mt-12 transition-opacity group-hover:opacity-30",
        colors.iconBg.replace("bg-", "bg-").replace("-50", "-200")
      )}></div>
      
      <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-3 pt-4 px-3.5">
        <div className="flex-1 min-w-0 pr-2">
          <CardTitle className="text-[9px] font-bold text-foreground/90 uppercase tracking-wide leading-tight line-clamp-2">
            {title}
          </CardTitle>
        </div>
        <div className={cn(
          "flex-shrink-0 p-1.5 rounded-md shadow-sm group-hover:shadow transition-all",
          colors.iconBg
        )}>
          <Icon className={cn("h-3.5 w-3.5", colors.icon)} />
        </div>
      </CardHeader>
      <CardContent className="relative px-3.5 pb-4 pt-0">
        <div className="space-y-2.5">
          <div className="flex items-end justify-between gap-1">
            <span className={cn("text-2xl font-bold tabular-nums leading-none", colors.percentage)}>
              {percentage}
              <span className="text-sm font-semibold ml-0.5">%</span>
            </span>
            <span className="text-[8px] font-semibold text-muted-foreground/80 uppercase tracking-wider px-1 py-0.5 rounded bg-muted/50 leading-tight">
              {status}
            </span>
          </div>
          
          {/* Show dual progress bars if actual/planned provided */}
          {showDualProgress ? (
            <div className="space-y-1.5">
              {/* Actual Progress */}
              <div>
                <div className="flex justify-between text-[7px] mb-0.5 text-muted-foreground">
                  <span>Actual</span>
                  <span className="font-semibold">{actualProgress.toFixed(1)}%</span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/50 shadow-inner">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-1000 ease-out", colors.progress)}
                    style={{ width: `${Math.min(100, actualProgress)}%` }}
                  />
                </div>
              </div>
              
              {/* Planned Progress */}
              <div>
                <div className="flex justify-between text-[7px] mb-0.5 text-muted-foreground">
                  <span>Planned</span>
                  <span className="font-semibold">{plannedProgress.toFixed(1)}%</span>
                  {variance !== null && (
                    <span className={cn(
                      "font-semibold",
                      variance >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {variance >= 0 ? "+" : ""}{variance.toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/50 shadow-inner">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out border border-dashed opacity-60"
                    style={{ 
                      width: `${Math.min(100, plannedProgress)}%`,
                      borderColor: colors.progress.replace("bg-", "").replace("-500", "-600"),
                      backgroundColor: "transparent"
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Single progress bar (legacy) */
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/50 shadow-inner">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out shadow-md relative overflow-hidden",
                  colors.progress
                )}
                style={{ width: `${percentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
          )}
          
          {/* Expandable sub-projects section */}
          {hasSubProjects && (
            <div className="pt-2 border-t border-border/30">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-[8px] font-semibold text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                <span>Sub-Projects ({subProjects.length})</span>
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
              
              {isExpanded && (
                <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                  {subProjects.map((subProject) => {
                    // Convert Tailwind color class to hex for SubProjectCard
                    const colorMap: Record<string, string> = {
                      "bg-blue-500": "#3b82f6",
                      "bg-emerald-500": "#10b981",
                      "bg-orange-500": "#f59e0b",
                      "bg-purple-500": "#a855f7",
                      "bg-red-500": "#ef4444",
                      "bg-yellow-500": "#eab308",
                      "bg-primary": "hsl(var(--primary))"
                    };
                    const hexColor = colorMap[colors.progress] || "#6b7280";
                    
                    return (
                      <SubProjectCard 
                        key={subProject.id} 
                        subProject={subProject}
                        color={hexColor}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

