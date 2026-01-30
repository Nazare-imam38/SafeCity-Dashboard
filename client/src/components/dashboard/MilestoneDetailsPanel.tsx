import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PlannedVsActualChart } from "@/components/dashboard/PlannedVsActualChart";
import type { SubProject } from "@/components/dashboard/SubProjectCard";
import { useWindowSize } from "@/hooks/use-window-size";

type PhaseTimelinePoint = {
  month: string;
  actual: number;
  planned: number;
};

export type MilestonePhaseProgress = {
  actual: number;
  planned: number;
  subProjects?: SubProject[];
  timeline?: PhaseTimelinePoint[];
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

// Simple deterministic hash -> 0..1
const hash01 = (input: string) => {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // unsigned -> 0..1
  return (h >>> 0) / 0xffffffff;
};

function buildDeterministicSubprojectTimeline(
  sub: SubProject,
  parentTimeline: PhaseTimelinePoint[]
): PhaseTimelinePoint[] {
  const n = parentTimeline.length;
  if (n === 0) return [];

  // stable factor per subproject, gives different curve "speed" but deterministic
  const factor = 0.75 + hash01(sub.id + "|factor") * 0.5; // 0.75..1.25
  const plannedFactor = 0.8 + hash01(sub.id + "|pf") * 0.4; // 0.8..1.2

  // Base series derived from parent points
  const base = parentTimeline.map((p) => ({
    month: p.month,
    actual: clamp(p.actual * factor, 0, 100),
    planned: clamp(p.planned * plannedFactor, 0, 100),
  }));

  // Ensure last point matches the provided subproject snapshot (so charts stay consistent)
  const last = base[n - 1];
  const aScale = last.actual > 0 ? sub.actualProgress / last.actual : 1;
  const pScale = last.planned > 0 ? sub.plannedProgress / last.planned : 1;

  return base.map((p, idx) => {
    // light easing toward scaled values, keeps earlier months reasonable
    const t = idx / Math.max(1, n - 1);
    const ease = t * t * (3 - 2 * t); // smoothstep
    return {
      month: p.month,
      actual: clamp(p.actual * (1 + (aScale - 1) * ease), 0, 100),
      planned: clamp(p.planned * (1 + (pScale - 1) * ease), 0, 100),
    };
  });
}

type GanttTask = {
  id: string;
  name: string;
  startIdx: number;
  endIdx: number;
  weight: number;
  status: "ahead" | "behind" | "ontrack";
  children?: GanttTask[];
};

const CHILD_NAME_TEMPLATES: Record<string, string[]> = {
  "Site Survey & Assessment": ["Field Survey", "Data Collection", "Site Measurements", "Survey Report"],
  "Technical Feasibility Study": ["Requirements Review", "Feasibility Analysis", "Risk Assessment", "Approval & Sign-off"],
  "Site Selection & Approval": ["Option Shortlisting", "Stakeholder Review", "Authority Approval", "Final Selection"],
  "Environmental Clearance": ["Documentation", "Submission", "Compliance Review", "Clearance Issuance"],

  "Excavation Work": ["Marking & Layout", "Excavation", "Disposal/Hauling", "Inspection"],
  "Foundation Pouring": ["Rebar Setup", "Formwork", "Concrete Pour", "Finishing"],
  "Curing & Quality Check": ["Curing", "Cube Tests", "QC Inspection", "Punch List"],
  "Backfilling & Compaction": ["Backfilling", "Layer Compaction", "Leveling", "Final Check"],

  "Cabinet Installation": ["Mounting", "Anchoring", "Alignment", "Handover"],
  "Electrical Connections": ["Cabling", "Terminations", "Earthing", "Testing"],
  "Network Setup": ["Fiber Pulling", "Splicing", "Switch Config", "Connectivity Test"],
  "Equipment Mounting": ["Bracket Install", "Device Mount", "Labeling", "Commissioning Prep"],

  "Cable Trenching": ["Route Marking", "Trenching", "Duct Placement", "Backfill"],
  "Fiber Optic Laying": ["Pulling", "Splicing", "OTDR Test", "Documentation"],
  "Power Cable Installation": ["Cable Pull", "Terminations", "Protection", "Load Test"],
  "Cable Termination & Testing": ["Termination", "Continuity Test", "Insulation Test", "Sign-off"],

  "Room Renovation": ["Civil Works", "Electrical Works", "Flooring/Ceiling", "Finishing"],
  "Server Installation": ["Rack Setup", "Server Mount", "Power & Network", "Burn-in Test"],
  "Display Systems": ["Mounting", "Cabling", "Calibration", "Acceptance Test"],
  "Control Systems Integration": ["Integration", "Configuration", "End-to-End Test", "Handover"],

  "System Integration": ["Interface Setup", "Data Mapping", "Integration Test", "UAT Support"],
  "Software Deployment": ["Environment Setup", "Deployment", "Smoke Tests", "Stabilization"],
  "Testing & Commissioning": ["Test Plans", "Commissioning", "Defect Fixes", "Final Verification"],
  "Go-Live Preparation": ["Training", "Runbook", "Cutover Plan", "Go-Live Readiness"],
};

function getChildNames(parentName: string, childCount: number): string[] {
  const tpl = CHILD_NAME_TEMPLATES[parentName];
  if (tpl && tpl.length) return tpl.slice(0, childCount);
  // Fallback: derive readable labels from parent
  return Array.from({ length: childCount }).map((_, i) => `${parentName} — Task ${i + 1}`);
}

function buildChildTasks(parent: GanttTask, seed: string): GanttTask[] {
  const span = parent.endIdx - parent.startIdx + 1;
  const childCount = clamp(Math.round(2 + hash01(seed + "|n") * 2), 2, 4); // 2..4
  const weightsRaw = Array.from({ length: childCount }).map((_, i) => 0.6 + hash01(seed + `|w|${i}`) * 0.8);
  const wSum = weightsRaw.reduce((a, b) => a + b, 0) || 1;
  const weights = weightsRaw.map(w => w / wSum);

  // Split parent's window into sequential child windows (with small deterministic overlaps)
  let cursor = parent.startIdx;
  const children: GanttTask[] = [];
  const childNames = getChildNames(parent.name, childCount);
  for (let i = 0; i < childCount; i++) {
    const remaining = parent.endIdx - cursor + 1;
    const minDur = 1;
    const maxDur = Math.max(minDur, remaining - (childCount - i - 1));
    const ideal = clamp(Math.round(span * weights[i]), minDur, maxDur);
    const overlap = i > 0 ? (hash01(seed + `|o|${i}`) > 0.75 ? 1 : 0) : 0;
    const startIdx = clamp(cursor - overlap, parent.startIdx, parent.endIdx);
    const endIdx = clamp(startIdx + ideal - 1, startIdx, parent.endIdx);

    children.push({
      id: `${parent.id}::${i}`,
      name: childNames[i] ?? `${parent.name} — Task ${i + 1}`,
      startIdx,
      endIdx,
      weight: parent.weight * weights[i],
      status: parent.status,
    });
    cursor = clamp(endIdx + 1, parent.startIdx, parent.endIdx);
  }
  return children;
}

function buildGanttTasks(subProjects: SubProject[], months: string[]): GanttTask[] {
  const n = months.length;
  if (n === 0) return [];

  return subProjects.map((s) => {
    const r1 = hash01(s.id + "|s");
    const r2 = hash01(s.id + "|d");
    const duration = clamp(Math.round(2 + r2 * 3), 1, Math.max(1, n)); // 2..5 (clamped)
    const startIdx = clamp(Math.round(r1 * Math.max(0, n - duration)), 0, Math.max(0, n - 1));
    const endIdx = clamp(startIdx + duration - 1, startIdx, Math.max(0, n - 1));

    const variance = s.actualProgress - s.plannedProgress;
    const status: GanttTask["status"] =
      Math.abs(variance) < 1 ? "ontrack" : variance >= 0 ? "ahead" : "behind";

    return {
      id: s.id,
      name: s.name,
      startIdx,
      endIdx,
      weight: s.weight,
      status,
      children: buildChildTasks(
        {
          id: s.id,
          name: s.name,
          startIdx,
          endIdx,
          weight: s.weight,
          status,
        },
        s.id
      ),
    };
  });
}

function statusColor(status: GanttTask["status"], baseColor: string) {
  if (status === "ahead") return "#10b981";
  if (status === "behind") return "#ef4444";
  return baseColor;
}

// Generate a deterministic "responsible person" name for a task
function getResponsiblePerson(taskId: string, taskName: string): string {
  const seed = hash01(taskId + "|person");
  const names = ["Team A", "Team B", "Team C", "Project Lead", "Site Manager", "QC Team"];
  return names[Math.floor(seed * names.length)];
}

// Calculate progress percentage for display
function getProgressPercentage(task: GanttTask): number {
  // Use a deterministic progress based on task status and position
  const seed = hash01(task.id + "|progress");
  if (task.status === "ahead") return Math.round(60 + seed * 40); // 60-100%
  if (task.status === "behind") return Math.round(20 + seed * 40); // 20-60%
  return Math.round(40 + seed * 40); // 40-80%
}

function GanttMini({
  tasks,
  months,
  baseColor,
}: {
  tasks: GanttTask[];
  months: string[];
  baseColor: string;
}) {
  const n = months.length || 1;
  // Initialize all tasks as expanded by default
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    tasks.forEach(task => {
      if (task.children && task.children.length > 0) {
        initial[task.id] = true;
      }
    });
    return initial;
  });
  const { width } = useWindowSize();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;

  const toggle = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setExpanded((prev) => {
      const currentValue = prev[id] ?? true; // Default to true (expanded)
      return { ...prev, [id]: !currentValue };
    });
  };

  // Calculate grid columns: responsive left label column + one column per month
  const labelColWidth = isMobile ? '140px' : isTablet ? '180px' : '240px';
  const gridCols = `${labelColWidth} repeat(${n}, 1fr)`;

  return (
    <div className="space-y-4">
      {/* Gantt Chart Container with full border */}
      <div className="border-2 border-border rounded-lg overflow-hidden bg-background">
        {/* Header row with month labels */}
        <div className={`grid border-b-2 border-border bg-muted/30 ${isMobile ? 'overflow-x-auto min-w-full' : ''}`} style={{ gridTemplateColumns: gridCols }}>
          <div className={`${isMobile ? 'p-1.5 text-[10px]' : 'p-2 text-xs'} font-bold text-muted-foreground border-r-2 border-border bg-muted/40`}>WBS Subprocess</div>
          {months.map((m, idx) => (
            <div
              key={m}
              className={`${isMobile ? 'p-1.5 text-[10px]' : 'p-2 text-xs'} font-semibold text-center text-muted-foreground border-r-2 border-border bg-muted/40 last:border-r-0`}
            >
              {isMobile ? m.substring(0, 3) : m}
            </div>
          ))}
        </div>

        {/* Task rows */}
        <div className={`space-y-1 ${isMobile ? 'overflow-x-auto min-w-full' : ''}`}>
        {tasks.map((t) => {
          const isExpanded = expanded[t.id] ?? true;
          const hasChildren = (t.children?.length ?? 0) > 0;
          const progress = getProgressPercentage(t);
          const responsible = getResponsiblePerson(t.id, t.name);
          const span = t.endIdx - t.startIdx + 1;

          return (
            <div key={t.id} className="space-y-1">
              {/* Parent task row */}
              <div className={`grid border-l-2 border-r-2 border-b-2 border-border relative ${isMobile ? 'min-w-full' : 'overflow-hidden'} bg-background`} style={{ gridTemplateColumns: gridCols }}>
                {/* Left label column */}
                <div className="p-2 border-r-2 border-border flex items-center gap-2 min-w-0 relative z-10 bg-muted/20" onClick={(e) => e.stopPropagation()}>
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={(e) => toggle(t.id, e)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="h-5 w-5 rounded border border-border/60 bg-background hover:bg-muted/40 transition-colors flex items-center justify-center flex-shrink-0 relative z-20"
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      <span className="text-[10px] font-bold leading-none">{isExpanded ? "−" : "+"}</span>
                    </button>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-foreground truncate`}>{t.name}</div>
                    <div className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} text-muted-foreground`}>
                      Weight {(t.weight * 100).toFixed(0)}% •{" "}
                      <span
                        className={
                          t.status === "ahead"
                            ? "text-emerald-600"
                            : t.status === "behind"
                            ? "text-red-600"
                            : "text-blue-600"
                        }
                      >
                        {t.status === "ontrack" ? "On track" : t.status === "ahead" ? "Ahead" : "Behind"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline container - wraps grid cells and bars */}
                <div className="relative border-r-2 border-border" style={{ gridColumn: `2 / -1` }}>
                  {/* Grid cells for timeline - background cells */}
                  <div className="grid h-12" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
                    {months.map((m, monthIdx) => (
                      <div
                        key={m}
                        className="border-r-2 border-border last:border-r-0 bg-muted/20"
                      />
                    ))}
                  </div>

                  {/* Task bar spanning across cells */}
                  <div
                    className="absolute top-1 bottom-1 flex items-center px-2 rounded shadow-sm z-20 pointer-events-none"
                    style={{
                      left: `${(t.startIdx / n) * 100}%`,
                      width: `${(span / n) * 100}%`,
                      maxWidth: `calc(100% - ${(t.startIdx / n) * 100}%)`,
                      backgroundColor: statusColor(t.status, baseColor),
                    }}
                  >
                    <div className={`${isMobile ? 'text-[8px]' : 'text-[9px]'} font-semibold text-white truncate flex-1 pointer-events-auto`}>
                      <div className="truncate">{responsible}</div>
                      <div className={`${isMobile ? 'text-[7px]' : 'text-[8px]'} opacity-90`}>{progress}% Done</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Child task rows */}
              {hasChildren && isExpanded && (
                <div className="space-y-0.5 pl-6">
                  {t.children!.map((c) => {
                    const childProgress = getProgressPercentage(c);
                    const childResponsible = getResponsiblePerson(c.id, c.name);
                    const childSpan = c.endIdx - c.startIdx + 1;

                    return (
                      <div
                        key={c.id}
                        className={`grid border-l-2 border-r-2 border-b-2 border-border relative ${isMobile ? 'min-w-full' : 'overflow-hidden'} bg-background`}
                        style={{ gridTemplateColumns: gridCols }}
                      >
                        {/* Left label column */}
                        <div className="p-1.5 border-r-2 border-border min-w-0 relative z-10 bg-muted/10">
                          <div className={`${isMobile ? 'text-[11px]' : 'text-xs'} font-medium text-foreground/90 truncate`}>{c.name}</div>
                          <div className={`${isMobile ? 'text-[8px]' : 'text-[9px]'} text-muted-foreground`}>
                            Weight {(c.weight * 100).toFixed(0)}%
                          </div>
                        </div>

                        {/* Timeline container - wraps grid cells and bars */}
                        <div className="relative border-r-2 border-border" style={{ gridColumn: `2 / -1` }}>
                          {/* Grid cells for timeline - background cells */}
                          <div className="grid h-10" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
                            {months.map((m) => (
                              <div
                                key={m}
                                className="border-r-2 border-border last:border-r-0 bg-muted/10"
                              />
                            ))}
                          </div>

                          {/* Child task bar spanning across cells */}
                          <div
                            className="absolute top-0.5 bottom-0.5 flex items-center px-1.5 rounded z-20 pointer-events-none"
                            style={{
                              left: `${(c.startIdx / n) * 100}%`,
                              width: `${(childSpan / n) * 100}%`,
                              maxWidth: `calc(100% - ${(c.startIdx / n) * 100}%)`,
                              backgroundColor: statusColor(c.status, baseColor),
                              opacity: 0.75,
                            }}
                          >
                            <div className={`${isMobile ? 'text-[7px]' : 'text-[8px]'} font-medium text-white truncate flex-1 pointer-events-auto`}>
                              <div className="truncate">{childResponsible}</div>
                              <div className={`${isMobile ? 'text-[6px]' : 'text-[7px]'} opacity-90`}>{childProgress}%</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

export function MilestoneDetailsPanel({
  milestoneTitle,
  phase,
  phaseColor,
  onClear,
  showAllTabs = false,
}: {
  milestoneTitle: string;
  phase: MilestonePhaseProgress;
  phaseColor: string;
  onClear?: () => void;
  showAllTabs?: boolean;
}) {
  const [tab, setTab] = useState<"gantt" | "wbs" | "scurves">("gantt");
  const { width } = useWindowSize();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;

  const subProjects = phase.subProjects ?? [];
  const timeline = phase.timeline ?? [];
  const months = useMemo(() => timeline.map((t) => t.month), [timeline]);

  const ganttTasks = useMemo(() => buildGanttTasks(subProjects, months), [subProjects, months]);

  const wbsPieData = useMemo(
    () =>
      subProjects.map((s) => ({
        name: s.name,
        value: Math.max(0, s.weight),
      })),
    [subProjects]
  );

  const subProjectTimelines = useMemo(() => {
    if (timeline.length === 0) return [];
    return subProjects.map((s) => ({
      sub: s,
      timeline: buildDeterministicSubprojectTimeline(s, timeline),
    }));
  }, [subProjects, timeline]);

  if (subProjects.length === 0 || timeline.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>{milestoneTitle} — Details</CardTitle>
          <CardDescription>
            No WBS/timeline data found for this milestone yet. Add `subProjects` and `timeline` for the phase to enable Gantt, WBS breakdown and S-curves.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/10">
      <CardHeader>
          <div>
            <CardTitle className={isMobile ? 'text-base' : ''}>{milestoneTitle} — Milestone KPIs</CardTitle>
            <CardDescription className={isMobile ? 'text-xs' : ''}>
              Gantt plan, WBS breakdown, and S-curves (planned vs actual) for this milestone.
            </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAllTabs ? (
          <>
            {/* Show all charts side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gantt Chart */}
              <div className="lg:col-span-1">
                <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-bold mb-3`}>Gantt Chart</h3>
                <GanttMini tasks={ganttTasks} months={months} baseColor={phaseColor} />
              </div>

              {/* WBS Breakdown */}
              <div className="lg:col-span-1">
                <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-bold mb-3`}>WBS Breakdown</h3>
                <div className="space-y-6">
                  <div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold mb-2`}>WBS Weight Distribution</div>
                    <div className={`w-full ${isMobile ? 'h-[280px]' : isTablet ? 'h-[320px]' : 'h-[340px]'}`}>
                      <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={wbsPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={isMobile ? 70 : isTablet ? 90 : 110}
                        labelLine={false}
                        label={({ name, value, cx, cy, midAngle, innerRadius, outerRadius, index }) => {
                          const pct = value * 100;
                          if (pct < 6) return null;
                          const RADIAN = Math.PI / 180;
                          const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          
                          // Calculate the same color as the segment
                          const segmentColor = `hsl(${Math.round((index / Math.max(1, wbsPieData.length)) * 280)} 75% 55%)`;
                          const fontSize = isMobile ? '10px' : isTablet ? '11px' : '12px';
                          
                          return (
                            <text
                              x={x}
                              y={y}
                              fill={segmentColor}
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline="central"
                              style={{ 
                                fontSize, 
                                fontWeight: 600,
                                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
                              }}
                            >
                              {`${name}: ${(pct).toFixed(0)}%`}
                            </text>
                          );
                        }}
                      >
                        {wbsPieData.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={`hsl(${Math.round((idx / Math.max(1, wbsPieData.length)) * 280)} 75% 55%)`}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, "Weight"]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: isMobile ? '10px' : '12px',
                          padding: isMobile ? '4px 6px' : '8px 12px'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ 
                          fontSize: isMobile ? '10px' : isTablet ? '11px' : '12px' 
                        }}
                        iconSize={isMobile ? 10 : isTablet ? 11 : 12}
                        layout={isMobile ? 'vertical' : 'horizontal'}
                        verticalAlign={isMobile ? 'bottom' : 'top'}
                      />
                    </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold mb-2`}>WBS Subprocess KPIs</div>
                    <div className="space-y-2">
                      {subProjects.map((s) => {
                        const variance = s.actualProgress - s.plannedProgress;
                        return (
                          <div key={s.id} className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'} rounded-lg border border-border/50 ${isMobile ? 'p-2' : 'p-3'} bg-card/50`}>
                            <div className="min-w-0 flex-1">
                              <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold truncate`}>{s.name}</div>
                              <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>Weight {(s.weight * 100).toFixed(0)}%</div>
                            </div>
                            <div className={`${isMobile ? 'text-left' : 'text-right'}`}>
                              <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>Actual / Planned</div>
                              <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold tabular-nums`}>
                                {s.actualProgress.toFixed(1)}% / {s.plannedProgress.toFixed(1)}%
                              </div>
                              <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-semibold ${variance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                {variance >= 0 ? "+" : ""}
                                {variance.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* S-Curves */}
              <div className="lg:col-span-1">
                <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-bold mb-3`}>S-Curves</h3>
                <div className="space-y-4">
                  {subProjectTimelines.map(({ sub, timeline }) => (
                    <PlannedVsActualChart
                      key={sub.id}
                      phaseName={sub.name}
                      timelineData={timeline}
                      color={phaseColor}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className={`w-full ${isMobile ? 'grid grid-cols-3' : 'justify-start'}`}>
              <TabsTrigger value="gantt" className={isMobile ? 'text-xs' : ''}>Gantt</TabsTrigger>
              <TabsTrigger value="wbs" className={isMobile ? 'text-xs' : ''}>WBS Breakdown</TabsTrigger>
              <TabsTrigger value="scurves" className={isMobile ? 'text-xs' : ''}>S-Curves</TabsTrigger>
            </TabsList>

            <TabsContent value="gantt" className="mt-4">
              <GanttMini tasks={ganttTasks} months={months} baseColor={phaseColor} />
            </TabsContent>

            <TabsContent value="wbs" className="mt-4">
              <div className="space-y-6">
                <div>
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold mb-2`}>WBS Weight Distribution</div>
                  <div className={`w-full ${isMobile ? 'h-[280px]' : isTablet ? 'h-[320px]' : 'h-[340px]'}`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={wbsPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={isMobile ? 70 : isTablet ? 90 : 110}
                          labelLine={false}
                          label={({ name, value, cx, cy, midAngle, innerRadius, outerRadius, index }) => {
                            const pct = value * 100;
                            if (pct < 6) return null;
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            
                            // Calculate the same color as the segment
                            const segmentColor = `hsl(${Math.round((index / Math.max(1, wbsPieData.length)) * 280)} 75% 55%)`;
                            const fontSize = isMobile ? '10px' : isTablet ? '11px' : '12px';
                            
                            return (
                              <text
                                x={x}
                                y={y}
                                fill={segmentColor}
                                textAnchor={x > cx ? 'start' : 'end'}
                                dominantBaseline="central"
                                style={{ 
                                  fontSize, 
                                  fontWeight: 600,
                                  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
                                }}
                              >
                                {`${name}: ${(pct).toFixed(0)}%`}
                              </text>
                            );
                          }}
                        >
                          {wbsPieData.map((_, idx) => (
                            <Cell
                              key={idx}
                              fill={`hsl(${Math.round((idx / Math.max(1, wbsPieData.length)) * 280)} 75% 55%)`}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, "Weight"]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: isMobile ? '10px' : '12px',
                            padding: isMobile ? '4px 6px' : '8px 12px'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ 
                            fontSize: isMobile ? '10px' : isTablet ? '11px' : '12px' 
                          }}
                          iconSize={isMobile ? 10 : isTablet ? 11 : 12}
                          layout={isMobile ? 'vertical' : 'horizontal'}
                          verticalAlign={isMobile ? 'bottom' : 'top'}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold mb-2`}>WBS Subprocess KPIs</div>
                  <div className="space-y-2">
                    {subProjects.map((s) => {
                      const variance = s.actualProgress - s.plannedProgress;
                      return (
                        <div key={s.id} className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'} rounded-lg border border-border/50 ${isMobile ? 'p-2' : 'p-3'} bg-card/50`}>
                          <div className="min-w-0 flex-1">
                            <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold truncate`}>{s.name}</div>
                            <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>Weight {(s.weight * 100).toFixed(0)}%</div>
                          </div>
                          <div className={`${isMobile ? 'text-left' : 'text-right'}`}>
                            <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>Actual / Planned</div>
                            <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold tabular-nums`}>
                              {s.actualProgress.toFixed(1)}% / {s.plannedProgress.toFixed(1)}%
                            </div>
                            <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-semibold ${variance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {variance >= 0 ? "+" : ""}
                              {variance.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="scurves" className="mt-4">
              <div className="grid gap-4 grid-cols-1">
                {subProjectTimelines.map(({ sub, timeline }) => (
                  <PlannedVsActualChart
                    key={sub.id}
                    phaseName={sub.name}
                    timelineData={timeline}
                    color={phaseColor}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}


