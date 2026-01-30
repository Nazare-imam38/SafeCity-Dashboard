import { Layout } from "@/components/layout/Layout";
import { InstallationCard } from "@/components/dashboard/InstallationCard";
import { PhaseDistributionChart } from "@/components/dashboard/PhaseDistributionChart";
import { PhaseTimelineChart } from "@/components/dashboard/PhaseTimelineChart";
import { PlannedVsActualChart } from "@/components/dashboard/PlannedVsActualChart";
import { MilestoneDetailsPanel } from "@/components/dashboard/MilestoneDetailsPanel";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useWindowSize } from "@/hooks/use-window-size";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  getAllTehsilData,
  InstallationData
} from "@/data/punjabInstallationData";
import { PUNJAB_HIERARCHY } from "@/data/punjabHierarchy";
import { 
  ClipboardCheck, 
  Building2, 
  Camera, 
  Zap, 
  Home, 
  Radio,
  TrendingUp,
  ArrowLeft
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { SubProject } from "@/components/dashboard/SubProjectCard";

// Enhanced installation progress data with sub-projects and planned vs actual
interface PhaseProgress {
  actual: number;
  planned: number;
  subProjects?: SubProject[];
  timeline?: {
    month: string;
    actual: number;
    planned: number;
  }[];
}

interface CityInstallationData {
  surveys: number | PhaseProgress;
  foundations: number | PhaseProgress;
  cabinet: number | PhaseProgress;
  cable: number | PhaseProgress;
  controlRoom: number | PhaseProgress;
  ppic3: number | PhaseProgress;
  overall: number;
  timeline?: {
    month: string;
    surveys: number;
    foundations: number;
    cabinet: number;
    cable: number;
    controlRoom: number;
    ppic3: number;
    overall: number;
  }[];
}

type PhaseKey = "surveys" | "foundations" | "cabinet" | "cable" | "controlRoom" | "ppic3";

// Helper function to get progress value (backward compatible)
const getProgressValue = (progress: number | PhaseProgress): number => {
  return typeof progress === 'number' ? progress : progress.actual;
};

// Helper function to check if progress has detailed data
const hasDetailedProgress = (progress: number | PhaseProgress): progress is PhaseProgress => {
  return typeof progress !== 'number';
};

// Generate sub-projects for a phase (sample data structure)
const generateSubProjects = (
  phaseKey: string,
  actualProgress: number,
  plannedProgress: number
): SubProject[] => {
  // Sample sub-project structure - this should be replaced with real data
  const subProjectTemplates: Record<string, { names: string[], weights: number[] }> = {
    surveys: {
      names: ["Site Survey & Assessment", "Technical Feasibility Study", "Site Selection & Approval", "Environmental Clearance"],
      weights: [0.30, 0.25, 0.25, 0.20]
    },
    foundations: {
      names: ["Excavation Work", "Foundation Pouring", "Curing & Quality Check", "Backfilling & Compaction"],
      weights: [0.25, 0.35, 0.20, 0.20]
    },
    cabinet: {
      names: ["Cabinet Installation", "Electrical Connections", "Network Setup", "Equipment Mounting"],
      weights: [0.30, 0.25, 0.25, 0.20]
    },
    cable: {
      names: ["Cable Trenching", "Fiber Optic Laying", "Power Cable Installation", "Cable Termination & Testing"],
      weights: [0.25, 0.30, 0.25, 0.20]
    },
    controlRoom: {
      names: ["Room Renovation", "Server Installation", "Display Systems", "Control Systems Integration"],
      weights: [0.25, 0.30, 0.25, 0.20]
    },
    ppic3: {
      names: ["System Integration", "Software Deployment", "Testing & Commissioning", "Go-Live Preparation"],
      weights: [0.30, 0.25, 0.25, 0.20]
    }
  };

  const template = subProjectTemplates[phaseKey] || {
    names: ["Sub-Project 1", "Sub-Project 2", "Sub-Project 3"],
    weights: [0.33, 0.33, 0.34]
  };

  // Generate sub-projects with variance based on parent progress
  const variance = actualProgress - plannedProgress;
  
  return template.names.map((name, index) => {
    const weight = template.weights[index];
    const baseActual = actualProgress * (0.8 + Math.random() * 0.4); // Vary around parent
    const basePlanned = plannedProgress * (0.8 + Math.random() * 0.4);
    
    return {
      id: `${phaseKey}-${index}`,
      name,
      actualProgress: Math.min(100, Math.max(0, baseActual)),
      plannedProgress: Math.min(100, Math.max(0, basePlanned)),
      weight
    };
  });
};

// Helper to convert legacy data to new format
const convertToPhaseProgress = (
  currentValue: number,
  phaseKey: string,
  timelineData?: { month: string; [key: string]: number | string }[]
): PhaseProgress => {
  // Generate planned progress (typically 5-10% higher initially, then converges)
  const plannedProgress = Math.min(100, currentValue + (100 - currentValue) * 0.15);
  
  // Generate timeline if not provided
  const timeline = timelineData?.map(point => {
    const actual = (point[phaseKey] as number) || 0;
    const planned = Math.min(100, actual + (100 - actual) * 0.15);
    return {
      month: point.month as string,
      actual,
      planned
    };
  }) || [];

  // Generate default timeline if none provided
  const defaultTimeline = timeline.length === 0 ? [
    { month: "Jan", actual: Math.max(0, currentValue * 0.1), planned: Math.max(0, plannedProgress * 0.15) },
    { month: "Feb", actual: Math.max(0, currentValue * 0.25), planned: Math.max(0, plannedProgress * 0.30) },
    { month: "Mar", actual: Math.max(0, currentValue * 0.40), planned: Math.max(0, plannedProgress * 0.45) },
    { month: "Apr", actual: Math.max(0, currentValue * 0.55), planned: Math.max(0, plannedProgress * 0.60) },
    { month: "May", actual: Math.max(0, currentValue * 0.70), planned: Math.max(0, plannedProgress * 0.75) },
    { month: "Jun", actual: Math.max(0, currentValue * 0.85), planned: Math.max(0, plannedProgress * 0.90) },
    { month: "Jul", actual: currentValue, planned: plannedProgress },
  ] : timeline;

  return {
    actual: currentValue,
    planned: plannedProgress,
    subProjects: generateSubProjects(phaseKey, currentValue, plannedProgress),
    timeline: defaultTimeline
  };
};

const installationPhases = [
  {
    key: "surveys" as const,
    title: "Surveys",
    icon: ClipboardCheck,
    color: "blue" as const,
  },
  {
    key: "foundations" as const,
    title: "Foundations Pole Installations",
    icon: Building2,
    color: "emerald" as const,
  },
  {
    key: "cabinet" as const,
    title: "Cabinet Cameras Installation",
    icon: Camera,
    color: "orange" as const,
  },
  {
    key: "cable" as const,
    title: "Cable Laying & Power Connections",
    icon: Zap,
    color: "purple" as const,
  },
  {
    key: "controlRoom" as const,
    title: "Control Room Renovations",
    icon: Home,
    color: "red" as const,
  },
  {
    key: "ppic3" as const,
    title: "PPIC3 Go Live",
    icon: Radio,
    color: "indigo" as const,
  },
];

export default function ProjectDetail() {
  const [location, setLocation] = useLocation();
  const { width } = useWindowSize();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const [selectedMilestoneKey, setSelectedMilestoneKey] = useState<PhaseKey | null>(null);

  // Extract tehsil and projectId from URL
  // URL format: /project/:tehsil/:projectId
  const pathParts = location.split('/').filter(Boolean);
  const tehsilName = pathParts[1] || '';
  const projectId = pathParts[2] || '';

  // Find the actual tehsil name from hierarchy
  const actualTehsilName = useMemo(() => {
    if (!tehsilName) return null;
    const tehsilSlug = tehsilName.toLowerCase().replace(/\s+/g, '');
    for (const div of PUNJAB_HIERARCHY) {
      for (const dist of div.districts) {
        for (const teh of dist.tehsils) {
          const tehSlug = teh.tehsil.toLowerCase().replace(/\s+/g, '');
          if (tehSlug === tehsilSlug || tehSlug.includes(tehsilSlug) || tehsilSlug.includes(tehSlug)) {
            return teh.tehsil;
          }
        }
      }
    }
    return null;
  }, [tehsilName]);

  // Get tehsil data
  const tehsilData = useMemo(() => {
    if (!tehsilName) return null;
    const allTehsilData = getAllTehsilData();
    // Find the tehsil data - the key format is division-district-tehsil
    const tehsilKey = Object.keys(allTehsilData).find(key => 
      key.toLowerCase().includes(tehsilName.toLowerCase().replace(/\s+/g, ''))
    );
    return tehsilKey ? allTehsilData[tehsilKey] : null;
  }, [tehsilName]);

  // Find the selected project phase
  const selectedProject = useMemo(() => {
    if (!projectId || !tehsilData) return null;
    return installationPhases.find(p => p.key === projectId);
  }, [projectId, tehsilData]);

  // Get project-specific data
  const projectData = useMemo(() => {
    if (!selectedProject || !tehsilData) return null;
    const progress = tehsilData[selectedProject.key];
    return {
      progress,
      phase: selectedProject,
    };
  }, [selectedProject, tehsilData]);

  if (!tehsilName || !projectId || !tehsilData || !selectedProject || !projectData) {
    return (
      <Layout title="Project Not Found">
        <div className="space-y-6">
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
            className="rounded-xl cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Project not found. Please go back to the dashboard.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const progress = projectData.progress;
  const progressValue = getProgressValue(progress);
  const hasDetails = hasDetailedProgress(progress);

  // Convert to PhaseProgress if needed to get sub-projects
  const projectPhaseProgress: PhaseProgress = useMemo(() => {
    if (hasDetails) {
      return progress;
    } else {
      const timelineData = (tehsilData as any).timeline;
      return convertToPhaseProgress(progressValue, projectId, timelineData);
    }
  }, [hasDetails, progress, progressValue, projectId, tehsilData]);

  // Get sub-projects for the selected project
  const subProjects = projectPhaseProgress.subProjects || [];

  // Calculate metrics for this specific project
  const planned = projectPhaseProgress.planned;
  const actual = projectPhaseProgress.actual;
  const variance = actual - planned;
  const absVariance = Math.abs(variance);

  // Calculate totals for pie chart normalization
  const maxValue = Math.max(planned, actual);
  const totalForPie = maxValue + absVariance;
  const normalizedPlanned = totalForPie > 0 ? (planned / totalForPie) * 100 : 0;
  const normalizedActual = totalForPie > 0 ? (actual / totalForPie) * 100 : 0;
  const normalizedVariance = totalForPie > 0 ? (absVariance / totalForPie) * 100 : 0;

  const colorMap: Record<string, string> = {
    blue: "#3b82f6",
    green: "#10b981",
    orange: "#f59e0b",
    purple: "#a855f7",
    red: "#ef4444",
    yellow: "#eab308",
  };

  const phaseColor = colorMap[selectedProject.color] || "#6b7280";

  // Calculate overall progress for the tehsil
  const overallProgress = tehsilData.overall || 0;
  const rangeMeta =
    overallProgress < 25
      ? { label: "Low Progress", color: "#ef4444" }
      : overallProgress < 50
        ? { label: "Moderate Progress", color: "#f59e0b" }
        : overallProgress < 75
          ? { label: "Good Progress", color: "#3b82f6" }
          : overallProgress < 100
            ? { label: "High Progress", color: "#22c55e" }
            : { label: "Fully Completed", color: "#10b981" };

  return (
    <Layout title={`${selectedProject.title} - ${tehsilName} Tehsil`}>
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              // Navigate back to Dashboard with tehsil selected
              if (actualTehsilName) {
                // Use location state to pass tehsil info
                setLocation(`/?tehsil=${encodeURIComponent(actualTehsilName)}`);
              } else {
                setLocation('/');
              }
            }}
            className="rounded-xl cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {actualTehsilName || 'Tehsil'} Projects
          </Button>
          <div>
            <h2 className="text-2xl font-bold font-heading">{selectedProject.title}</h2>
            <p className="text-sm text-muted-foreground">{tehsilName} Tehsil - Project Details</p>
          </div>
        </div>

        {/* Project KPIs - Sub-projects of the selected project */}
        <div className="w-full">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-heading mb-1">Project KPIs</h2>
              <p className="text-sm text-muted-foreground">Sub-projects breakdown for {selectedProject.title}</p>
            </div>
            {selectedMilestoneKey && (
              <button
                type="button"
                onClick={() => setSelectedMilestoneKey(null)}
                className="h-9 px-4 rounded-xl border border-border/60 bg-background hover:bg-muted/40 text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0"
              >
                Clear
              </button>
            )}
          </div>
          {subProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {subProjects.map((subProject) => {
                const subProjectProgress = Math.round(subProject.actualProgress);
                const isSelected = selectedMilestoneKey === subProject.id;
              
              return (
                <InstallationCard
                    key={subProject.id}
                    title={subProject.name}
                    percentage={subProjectProgress}
                    icon={selectedProject.icon}
                    color={selectedProject.color}
                    actualProgress={subProject.actualProgress}
                    plannedProgress={subProject.plannedProgress}
                    selected={isSelected}
                  onClick={() => {
                      setSelectedMilestoneKey(prev => (prev === subProject.id ? null : subProject.id));
                  }}
                />
              );
            })}
          </div>
          ) : (
            <Card className="border-border/50">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center">
                  No sub-projects found for {selectedProject.title}. Sub-projects will be generated automatically.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Charts Section - Always visible, updates based on selected KPI */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold font-heading mb-1">Project Charts</h2>
            <p className="text-sm text-muted-foreground">
              {selectedMilestoneKey 
                ? `Gantt chart, WBS breakdown, and S-curves for ${installationPhases.find(p => p.key === selectedMilestoneKey)?.title || 'selected milestone'}`
                : `Gantt chart, WBS breakdown, and S-curves for ${selectedProject.title}`
              }
            </p>
          </div>

          {/* Get current phase data based on selection */}
          {(() => {
            // If a sub-project KPI is selected, show that sub-project's data
            // Otherwise, show the main project's data
            let currentPhase: PhaseProgress;
            let currentPhaseTitle: string;
            let currentPhaseColor: string;

            if (selectedMilestoneKey && subProjects.length > 0) {
              // A sub-project KPI was selected
              const selectedSubProject = subProjects.find(sp => sp.id === selectedMilestoneKey);
              if (selectedSubProject) {
                // Create a PhaseProgress for the selected sub-project
                // Use the sub-project's timeline (generate from parent timeline)
                const subProjectTimeline = projectPhaseProgress.timeline?.map(t => ({
                  month: t.month,
                  actual: selectedSubProject.actualProgress * (t.actual / 100),
                  planned: selectedSubProject.plannedProgress * (t.planned / 100),
                })) || [];

                currentPhase = {
                  actual: selectedSubProject.actualProgress,
                  planned: selectedSubProject.plannedProgress,
                  subProjects: [], // Sub-project has no further sub-projects
                  timeline: subProjectTimeline,
                };
                currentPhaseTitle = selectedSubProject.name;
                currentPhaseColor = phaseColor;
              } else {
                // Fallback to main project
                currentPhase = projectPhaseProgress;
                currentPhaseTitle = selectedProject.title;
                currentPhaseColor = phaseColor;
              }
            } else {
              // No sub-project selected, show main project data
              currentPhase = projectPhaseProgress;
              currentPhaseTitle = selectedProject.title;
              currentPhaseColor = phaseColor;
            }

            if (!currentPhase || !currentPhase.timeline || currentPhase.timeline.length === 0) {
              return (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>{currentPhaseTitle} — Charts</CardTitle>
                    <CardDescription>
                      No timeline data found for this project yet. Timeline data is required to enable Gantt, WBS breakdown and S-curves.
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            }

            // For sub-project selection, we still show the main project's sub-projects in WBS
            // but filter the timeline to the selected sub-project
            const displayPhase = selectedMilestoneKey && subProjects.find(sp => sp.id === selectedMilestoneKey)
              ? {
                  ...currentPhase,
                  subProjects: projectPhaseProgress.subProjects || [], // Keep all sub-projects for WBS view
                }
              : currentPhase;

            return (
              <MilestoneDetailsPanel
                milestoneTitle={currentPhaseTitle}
                phase={displayPhase}
                phaseColor={currentPhaseColor}
                onClear={selectedMilestoneKey ? () => setSelectedMilestoneKey(null) : undefined}
                showAllTabs={true}
              />
            );
          })()}
          </div>
      </div>
    </Layout>
  );
}

