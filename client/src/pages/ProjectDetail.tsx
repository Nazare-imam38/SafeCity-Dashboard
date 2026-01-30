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
    color: "green" as const,
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
    color: "yellow" as const,
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

  // Calculate metrics for this specific project
  const planned = hasDetails ? progress.planned : progressValue;
  const actual = hasDetails ? progress.actual : progressValue;
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
            onClick={() => setLocation('/')}
            className="rounded-xl cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h2 className="text-2xl font-bold font-heading">{selectedProject.title}</h2>
            <p className="text-sm text-muted-foreground">{tehsilName} Tehsil - Project Details</p>
          </div>
        </div>

        {/* Project Milestones - All 6 cards */}
        <div className="w-full">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-heading mb-1">Project Milestones</h2>
              <p className="text-sm text-muted-foreground">Progress breakdown for {tehsilName} Tehsil</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {installationPhases.map((phase) => {
              const phaseProgress = tehsilData[phase.key];
              const phaseProgressValue = getProgressValue(phaseProgress);
              const phaseHasDetails = hasDetailedProgress(phaseProgress);
              
              return (
                <InstallationCard
                  key={`${tehsilName}-${phase.key}`}
                  title={phase.title}
                  percentage={phaseProgressValue}
                  icon={phase.icon}
                  color={phase.color}
                  actualProgress={phaseHasDetails ? phaseProgress.actual : undefined}
                  plannedProgress={phaseHasDetails ? phaseProgress.planned : undefined}
                  selected={selectedMilestoneKey === phase.key}
                  onClick={() => {
                    setSelectedMilestoneKey(prev => (prev === phase.key ? null : phase.key));
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Overall Progress Bar */}
        {!selectedMilestoneKey && (
          <Card className="relative overflow-hidden border-2 border-primary/20 shadow-xl bg-gradient-to-br from-card to-card/95 mb-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <CardContent className="relative p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-heading">Overall Progress</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tehsilName} Tehsil
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <div className="inline-block">
                    <div className="text-4xl font-bold font-heading bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent tabular-nums">
                      {overallProgress}
                      <span className="text-xl">%</span>
                    </div>
                    <div
                      className="mt-1 px-3 py-1 rounded-full border inline-block"
                      style={{
                        backgroundColor: `${rangeMeta.color}1A`,
                        borderColor: `${rangeMeta.color}40`,
                      }}
                    >
                      <span className="text-xs font-semibold" style={{ color: rangeMeta.color }}>
                        {rangeMeta.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend for progress ranges */}
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {[
                  { label: "0–25% Low", color: "#ef4444" },
                  { label: "25–50% Moderate", color: "#f59e0b" },
                  { label: "50–75% Good", color: "#3b82f6" },
                  { label: "75–100% High", color: "#22c55e" },
                ].map((it) => (
                  <div key={it.label} className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: it.color }} />
                    <span>{it.label}</span>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted/60 shadow-inner">
                  <div
                    className="h-full transition-all duration-1000 ease-out rounded-full shadow-lg relative overflow-hidden"
                    style={{
                      width: `${Math.max(0, Math.min(100, overallProgress))}%`,
                      backgroundColor: rangeMeta.color,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>0%</span>
                  <span className="font-medium">Target: 100%</span>
                  <span>100%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Pie Charts */}
        {!selectedMilestoneKey && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Project Progress Pie Chart */}
            <Card className="border-2 transition-colors hover:border-[#101a3c]">
              <CardHeader>
                <CardTitle>{selectedProject.title} Progress</CardTitle>
                <CardDescription>Planned vs Actual progress with variance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#3b82f6" }} />
                    <span className="text-muted-foreground">Planned:</span>
                    <span className="font-semibold">{planned.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#10b981" }} />
                    <span className="text-muted-foreground">Actual:</span>
                    <span className="font-semibold">{actual.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: variance < 0 ? "#f59e0b" : "#ef4444" }}
                    />
                    <span className="text-muted-foreground">Variance:</span>
                    <span className="font-semibold">{absVariance.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="w-full" style={{ height: isMobile ? '280px' : isTablet ? '320px' : '400px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <Pie
                        data={[
                          { 
                            name: 'Planned Progress', 
                            value: normalizedPlanned,
                            originalValue: planned,
                            color: '#3b82f6'
                          },
                          { 
                            name: 'Actual Progress', 
                            value: normalizedActual,
                            originalValue: actual,
                            color: '#10b981'
                          },
                          { 
                            name: 'Variance', 
                            value: normalizedVariance,
                            originalValue: absVariance,
                            color: variance < 0 ? '#f59e0b' : '#ef4444'
                          }
                        ]}
                        cx="50%"
                        cy="44%"
                        innerRadius={isMobile ? 38 : isTablet ? 48 : 60}
                        labelLine={false}
                        label={false}
                        outerRadius={isMobile ? 72 : isTablet ? 92 : 120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Planned Progress', value: normalizedPlanned, originalValue: planned, color: '#3b82f6' },
                          { name: 'Actual Progress', value: normalizedActual, originalValue: actual, color: '#10b981' },
                          { name: 'Variance', value: normalizedVariance, originalValue: absVariance, color: variance < 0 ? '#f59e0b' : '#ef4444' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: isMobile ? '11px' : '12px'
                        }}
                        formatter={(value: number, name: string, props: any) => {
                          const originalValue = props.payload?.originalValue ?? value;
                          return [`${originalValue.toFixed(1)}%`, name];
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        layout="horizontal"
                        wrapperStyle={{ paddingTop: isMobile ? "10px" : "14px", fontSize: isMobile ? '11px' : '12px' }}
                        formatter={(value) => {
                          let itemValue = 0;
                          if (value === 'Planned Progress') itemValue = planned;
                          else if (value === 'Actual Progress') itemValue = actual;
                          else if (value === 'Variance') itemValue = absVariance;
                          return `${value}: ${itemValue.toFixed(1)}%`;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Overall Progress Pie Chart */}
            <Card className="border-2 transition-colors hover:border-[#101a3c]">
              <CardHeader>
                <CardTitle>Overall Tehsil Progress</CardTitle>
                <CardDescription>All projects combined progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#3b82f6" }} />
                    <span className="text-muted-foreground">Overall:</span>
                    <span className="font-semibold">{overallProgress.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="w-full" style={{ height: isMobile ? '280px' : isTablet ? '320px' : '400px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <Pie
                        data={[
                          { 
                            name: 'Completed', 
                            value: overallProgress,
                            color: phaseColor
                          },
                          { 
                            name: 'Remaining', 
                            value: 100 - overallProgress,
                            color: '#e5e7eb'
                          }
                        ]}
                        cx="50%"
                        cy="44%"
                        innerRadius={isMobile ? 38 : isTablet ? 48 : 60}
                        labelLine={false}
                        label={false}
                        outerRadius={isMobile ? 72 : isTablet ? 92 : 120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Completed', value: overallProgress, color: phaseColor },
                          { name: 'Remaining', value: 100 - overallProgress, color: '#e5e7eb' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: isMobile ? '11px' : '12px'
                        }}
                        formatter={(value: number) => {
                          return [`${value.toFixed(1)}%`, ''];
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        layout="horizontal"
                        wrapperStyle={{ paddingTop: isMobile ? "10px" : "14px", fontSize: isMobile ? '11px' : '12px' }}
                        formatter={(value) => {
                          if (value === 'Completed') return `Completed: ${overallProgress.toFixed(1)}%`;
                          return `Remaining: ${(100 - overallProgress).toFixed(1)}%`;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Milestone details panel */}
        {selectedMilestoneKey && hasDetails && (
          <div className="space-y-4">
            <MilestoneDetailsPanel
              milestoneTitle={installationPhases.find(p => p.key === selectedMilestoneKey)?.title || ''}
              phase={{
                actual: hasDetailedProgress(tehsilData[selectedMilestoneKey]) ? tehsilData[selectedMilestoneKey].actual : getProgressValue(tehsilData[selectedMilestoneKey]),
                planned: hasDetailedProgress(tehsilData[selectedMilestoneKey]) ? tehsilData[selectedMilestoneKey].planned : getProgressValue(tehsilData[selectedMilestoneKey]),
                subProjects: hasDetailedProgress(tehsilData[selectedMilestoneKey]) ? tehsilData[selectedMilestoneKey].subProjects : undefined,
                timeline: hasDetailedProgress(tehsilData[selectedMilestoneKey]) ? tehsilData[selectedMilestoneKey].timeline : undefined,
              }}
              phaseColor={colorMap[installationPhases.find(p => p.key === selectedMilestoneKey)?.color || 'blue'] || "#6b7280"}
              onClear={() => setSelectedMilestoneKey(null)}
            />
          </div>
        )}

        {/* Charts Grid */}
        {!selectedMilestoneKey && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold font-heading mb-1">Analytics & Insights</h2>
              <p className="text-sm text-muted-foreground">Detailed progress analysis for {selectedProject.title} in {tehsilName} Tehsil</p>
            </div>
            
            {/* Phase Distribution Pie Chart */}
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-12">
                <PhaseDistributionChart 
                  data={installationPhases.map(phase => ({
                    phase: phase.title,
                    percentage: getProgressValue(tehsilData[phase.key]),
                  }))}
                />
              </div>
            </div>

            {/* Planned vs Actual Chart for Selected Project */}
            {hasDetails && progress.timeline && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold font-heading mb-2">Planned vs Actual Progress</h3>
                  <p className="text-sm text-muted-foreground">Timeline comparison for {selectedProject.title}</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <PlannedVsActualChart
                    phaseName={selectedProject.title}
                    timelineData={progress.timeline}
                    color={phaseColor}
                  />
                </div>
              </div>
            )}

            {/* Phase Timeline Chart */}
            {tehsilData.timeline && (
              <div className="grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-12">
                  <PhaseTimelineChart 
                    timelineData={tehsilData.timeline}
                    cityKey={tehsilName}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

