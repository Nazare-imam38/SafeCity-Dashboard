import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PlannedVsActualChart } from "@/components/dashboard/PlannedVsActualChart";
import type { SubProject } from "@/components/dashboard/SubProjectCard";

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

function buildChildTasks(parent: GanttTask, seed: string): GanttTask[] {
  const span = parent.endIdx - parent.startIdx + 1;
  const childCount = clamp(Math.round(2 + hash01(seed + "|n") * 2), 2, 4); // 2..4
  const weightsRaw = Array.from({ length: childCount }).map((_, i) => 0.6 + hash01(seed + `|w|${i}`) * 0.8);
  const wSum = weightsRaw.reduce((a, b) => a + b, 0) || 1;
  const weights = weightsRaw.map(w => w / wSum);

  // Split parent's window into sequential child windows (with small deterministic overlaps)
  let cursor = parent.startIdx;
  const children: GanttTask[] = [];
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
      name: `Sub-Activity ${i + 1}`,
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-3">
      <div className="grid" style={{ gridTemplateColumns: "220px 1fr" }}>
        <div className="text-xs font-semibold text-muted-foreground">WBS Subprocess</div>
        <div className="flex justify-between text-[11px] text-muted-foreground px-2">
          {months.map((m) => (
            <div key={m} className="w-full text-center">
              {m}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {tasks.map((t) => {
          const leftPct = (t.startIdx / n) * 100;
          const widthPct = ((t.endIdx - t.startIdx + 1) / n) * 100;
          const isExpanded = expanded[t.id] ?? true;
          const hasChildren = (t.children?.length ?? 0) > 0;

          return (
            <div key={t.id} className="space-y-1.5">
              {/* Parent row */}
              <div className="grid items-center gap-3" style={{ gridTemplateColumns: "220px 1fr" }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {hasChildren && (
                      <button
                        type="button"
                        onClick={() => toggle(t.id)}
                        className="h-6 w-6 rounded-md border border-border/60 bg-background hover:bg-muted/40 transition-colors flex items-center justify-center"
                        title={isExpanded ? "Collapse" : "Expand"}
                      >
                        <span className="text-xs font-bold">{isExpanded ? "−" : "+"}</span>
                      </button>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{t.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Weight {(t.weight * 100).toFixed(0)}% •{" "}
                        {t.status === "ontrack" ? "On track" : t.status === "ahead" ? "Ahead" : "Behind"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative h-8 rounded-lg bg-muted/40 overflow-hidden border border-border/50">
                  <div className="absolute inset-0 flex">
                    {months.map((m) => (
                      <div key={m} className="flex-1 border-r border-border/40 last:border-r-0" />
                    ))}
                  </div>
                  <div
                    className="absolute top-2 h-4 rounded-md shadow-sm"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: statusColor(t.status, baseColor),
                      opacity: 0.9,
                    }}
                    title={`${t.name} (${months[t.startIdx]} → ${months[t.endIdx]})`}
                  />
                </div>
              </div>

              {/* Child rows */}
              {hasChildren && isExpanded && (
                <div className="space-y-1.5 pl-8">
                  {t.children!.map((c) => {
                    const cLeftPct = (c.startIdx / n) * 100;
                    const cWidthPct = ((c.endIdx - c.startIdx + 1) / n) * 100;
                    return (
                      <div key={c.id} className="grid items-center gap-3" style={{ gridTemplateColumns: "220px 1fr" }}>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-foreground/90 truncate">{c.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            Weight {(c.weight * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className="relative h-7 rounded-lg bg-muted/30 overflow-hidden border border-border/40">
                          <div className="absolute inset-0 flex">
                            {months.map((m) => (
                              <div key={m} className="flex-1 border-r border-border/30 last:border-r-0" />
                            ))}
                          </div>
                          <div
                            className="absolute top-2 h-3 rounded-md"
                            style={{
                              left: `${cLeftPct}%`,
                              width: `${cWidthPct}%`,
                              backgroundColor: statusColor(c.status, baseColor),
                              opacity: 0.55,
                            }}
                            title={`${c.name} (${months[c.startIdx]} → ${months[c.endIdx]})`}
                          />
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
  );
}

export function MilestoneDetailsPanel({
  milestoneTitle,
  phase,
  phaseColor,
  onClear,
}: {
  milestoneTitle: string;
  phase: MilestonePhaseProgress;
  phaseColor: string;
  onClear?: () => void;
}) {
  const [tab, setTab] = useState<"gantt" | "wbs" | "scurves">("gantt");

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
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{milestoneTitle} — Milestone KPIs</CardTitle>
            <CardDescription>
              Gantt plan, WBS breakdown, and S-curves (planned vs actual) for this milestone.
            </CardDescription>
          </div>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="h-9 px-3 rounded-xl border border-border/60 bg-background hover:bg-muted/40 text-sm font-semibold transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="gantt">Gantt</TabsTrigger>
            <TabsTrigger value="wbs">WBS Breakdown</TabsTrigger>
            <TabsTrigger value="scurves">S-Curves</TabsTrigger>
          </TabsList>

          <TabsContent value="gantt" className="mt-4">
            <GanttMini tasks={ganttTasks} months={months} baseColor={phaseColor} />
          </TabsContent>

          <TabsContent value="wbs" className="mt-4">
            <div className="space-y-6">
              <div>
                <div className="text-sm font-semibold mb-2">WBS Weight Distribution</div>
                <div className="h-[340px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={wbsPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        labelLine={false}
                        label={({ name, value }) => {
                          const pct = value * 100;
                          if (pct < 6) return "";
                          return `${name}: ${(pct).toFixed(0)}%`;
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
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold mb-2">WBS Subprocess KPIs</div>
                <div className="space-y-2">
                  {subProjects.map((s) => {
                    const variance = s.actualProgress - s.plannedProgress;
                    return (
                      <div key={s.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3 bg-card/50">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate">{s.name}</div>
                          <div className="text-xs text-muted-foreground">Weight {(s.weight * 100).toFixed(0)}%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Actual / Planned</div>
                          <div className="text-sm font-bold tabular-nums">
                            {s.actualProgress.toFixed(1)}% / {s.plannedProgress.toFixed(1)}%
                          </div>
                          <div className={`text-xs font-semibold ${variance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
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
      </CardContent>
    </Card>
  );
}


