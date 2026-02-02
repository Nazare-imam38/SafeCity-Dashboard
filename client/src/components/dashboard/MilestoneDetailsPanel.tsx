import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PlannedVsActualChart } from "@/components/dashboard/PlannedVsActualChart";
import type { SubProject } from "@/components/dashboard/SubProjectCard";
import { useWindowSize } from "@/hooks/use-window-size";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, X, Plus, Trash2, Edit2, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

// Delay log data structure
export type DelayLog = {
  id: string;
  taskId: string;
  loggedBy: string;
  reason: string;
  delayDuration: number; // in days
  loggedAt: string; // ISO date string (when log was created)
  delayDate: string; // ISO date string (when delay occurred)
  monthIndex: number; // Which month the delay occurred (for filtering)
};

// Delay log form data
type DelayLogFormData = {
  loggedBy: string;
  reason: string;
  delayDuration: string;
  delayDate: string; // ISO date string
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

// Delay Log Form Dialog Component (for adding/editing)
function DelayLogFormDialog({
  open,
  onOpenChange,
  taskName,
  taskId,
  monthIndex,
  monthName,
  months,
  onSave,
  existingLog,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskName: string;
  taskId: string;
  monthIndex: number;
  monthName: string;
  months: string[];
  onSave: (log: DelayLog) => void;
  existingLog?: DelayLog;
  defaultDate?: string; // ISO date string for default date
}) {
  // Get default date: use existing log's delayDate, or defaultDate, or current date
  const getDefaultDate = () => {
    if (existingLog?.delayDate) {
      return existingLog.delayDate.split('T')[0]; // Get date part only
    }
    if (defaultDate) {
      return defaultDate.split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<DelayLogFormData>({
    loggedBy: existingLog?.loggedBy || "",
    reason: existingLog?.reason || "",
    delayDuration: existingLog?.delayDuration.toString() || "1",
    delayDate: getDefaultDate(),
  });

  // Reset form when dialog opens/closes or existingLog changes
  useEffect(() => {
    if (open) {
      setFormData({
        loggedBy: existingLog?.loggedBy || "",
        reason: existingLog?.reason || "",
        delayDuration: existingLog?.delayDuration.toString() || "1",
        delayDate: getDefaultDate(),
      });
    }
  }, [open, existingLog, defaultDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.loggedBy.trim() || !formData.reason.trim() || !formData.delayDate) {
      return;
    }

    // Calculate monthIndex from delayDate
    const delayDateObj = new Date(formData.delayDate);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const delayMonthName = monthNames[delayDateObj.getMonth()];
    const calculatedMonthIndex = months.findIndex(m => 
      m.includes(delayMonthName) || m === delayMonthName
    );

    const delayLog: DelayLog = {
      id: existingLog?.id || `${taskId}-${delayDateObj.getTime()}-${Date.now()}`,
      taskId,
      loggedBy: formData.loggedBy.trim(),
      reason: formData.reason.trim(),
      delayDuration: parseInt(formData.delayDuration, 10) || 1,
      loggedAt: existingLog?.loggedAt || new Date().toISOString(),
      delayDate: new Date(formData.delayDate).toISOString(),
      monthIndex: calculatedMonthIndex >= 0 ? calculatedMonthIndex : monthIndex,
    };

    onSave(delayLog);
    setFormData({ loggedBy: "", reason: "", delayDuration: "1", delayDate: new Date().toISOString().split('T')[0] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{existingLog ? "Edit" : "Add"} Delay Log for {taskName}</DialogTitle>
          <DialogDescription>
            {existingLog ? "Update" : "Record"} a delay that occurred in {monthName}. This will be displayed in the Gantt chart.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="loggedBy">Logged By *</Label>
              <Input
                id="loggedBy"
                placeholder="Enter your name or ID"
                value={formData.loggedBy}
                onChange={(e) => setFormData({ ...formData, loggedBy: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delayDate">Delay Date *</Label>
              <Input
                id="delayDate"
                type="date"
                value={formData.delayDate}
                onChange={(e) => setFormData({ ...formData, delayDate: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">Select the date when the delay occurred</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delayDuration">Delay Duration (Days) *</Label>
              <Input
                id="delayDuration"
                type="number"
                min="1"
                placeholder="1"
                value={formData.delayDuration}
                onChange={(e) => setFormData({ ...formData, delayDuration: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Delay *</Label>
              <Textarea
                id="reason"
                placeholder="Describe the reason for the delay..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.loggedBy.trim() || !formData.reason.trim()}>
              {existingLog ? "Update" : "Add"} Delay Log
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Delay Logs Table Component (shows all logs in a table format)
function DelayLogsTable({
  delayLogs,
  ganttTasks,
  subProjects,
  months,
  onEdit,
  onDelete,
  isMobile,
  isTablet,
}: {
  delayLogs: DelayLog[];
  ganttTasks: GanttTask[];
  subProjects?: SubProject[];
  months: string[];
  onEdit: (log: DelayLog) => void;
  onDelete: (logId: string) => void;
  isMobile: boolean;
  isTablet: boolean;
}) {
  // Get task name from taskId
  const getTaskName = (taskId: string): string => {
    // First check subProjects
    const subProject = subProjects?.find(sp => sp.id === taskId);
    if (subProject) return subProject.name;
    
    // Then check ganttTasks (including children)
    const findTaskInTree = (tasks: GanttTask[], id: string): GanttTask | null => {
      for (const task of tasks) {
        if (task.id === id) return task;
        if (task.children) {
          const found = findTaskInTree(task.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const task = findTaskInTree(ganttTasks, taskId);
    return task?.name || taskId;
  };

  if (delayLogs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-border rounded-lg">
        <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-medium">No delay logs recorded yet</p>
        <p className="text-xs mt-1">Delay logs will appear here when you log delays in the Gantt chart.</p>
      </div>
    );
  }

  // Sort logs by date (newest first)
  const sortedLogs = [...delayLogs].sort((a, b) => 
    new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {delayLogs.length} delay log{delayLogs.length !== 1 ? 's' : ''} recorded
        </div>
      </div>
      
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={isMobile ? 'w-[120px]' : ''}>Task Name</TableHead>
                <TableHead className={isMobile ? 'w-[80px]' : ''}>Month</TableHead>
                <TableHead className={isMobile ? 'w-[100px]' : ''}>Logged By</TableHead>
                <TableHead className={isMobile ? 'w-[80px]' : ''}>Duration</TableHead>
                <TableHead className={isMobile ? 'hidden' : ''}>Reason</TableHead>
                <TableHead className={isMobile ? 'w-[100px]' : ''}>Date</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className={`font-medium ${isMobile ? 'text-xs' : ''}`}>
                    <div className="max-w-[200px] truncate" title={getTaskName(log.taskId)}>
                      {getTaskName(log.taskId)}
                    </div>
                  </TableCell>
                  <TableCell className={isMobile ? 'text-xs' : ''}>
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {months[log.monthIndex] || `M${log.monthIndex + 1}`}
                    </Badge>
                  </TableCell>
                  <TableCell className={isMobile ? 'text-xs' : ''}>
                    {log.loggedBy}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1">
                      {log.delayDuration} day{log.delayDuration !== 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell className={isMobile ? 'hidden' : ''}>
                    <div className="max-w-[300px] truncate text-sm text-muted-foreground" title={log.reason}>
                      {log.reason}
                    </div>
                  </TableCell>
                  <TableCell className={isMobile ? 'text-xs' : 'text-sm'}>
                    {new Date(log.loggedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(log)}
                        className="h-8 w-8 p-0"
                        title="Edit log"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this delay log?")) {
                            onDelete(log.id);
                          }
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        title="Delete log"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Mobile view: Show reason in expanded view */}
      {isMobile && (
        <div className="space-y-2">
          {sortedLogs.map((log) => (
            <div key={log.id} className="border border-border rounded-lg p-3 bg-card/50">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{getTaskName(log.taskId)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {months[log.monthIndex] || `Month ${log.monthIndex + 1}`} • {log.loggedBy}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(log)}
                    className="h-7 w-7 p-0"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Delete this delay log?")) {
                        onDelete(log.id);
                      }
                    }}
                    className="h-7 w-7 p-0 text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-2">{log.reason}</div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {log.delayDuration} day{log.delayDuration !== 1 ? 's' : ''}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(log.loggedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Delay Logs List Dialog Component (shows all logs and allows adding new ones)
function DelayLogsListDialog({
  open,
  onOpenChange,
  taskName,
  taskId,
  monthIndex,
  monthName,
  months,
  delayLogs,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskName: string;
  taskId: string;
  monthIndex: number;
  monthName: string;
  months: string[];
  delayLogs: DelayLog[];
  onSave: (log: DelayLog) => void;
  onDelete: (logId: string) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLog, setEditingLog] = useState<DelayLog | undefined>(undefined);

  const handleAddNew = () => {
    setEditingLog(undefined);
    setShowAddForm(true);
  };

  const handleEdit = (log: DelayLog) => {
    setEditingLog(log);
    setShowAddForm(true);
  };

  const handleSave = (log: DelayLog) => {
    onSave(log);
    setShowAddForm(false);
    setEditingLog(undefined);
  };

  const handleDelete = (logId: string) => {
    if (confirm("Are you sure you want to delete this delay log?")) {
      onDelete(logId);
    }
  };

  if (showAddForm) {
    return (
      <DelayLogFormDialog
        open={showAddForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddForm(false);
            setEditingLog(undefined);
          }
        }}
        taskName={taskName}
        taskId={taskId}
        monthIndex={monthIndex}
        monthName={monthName}
        months={months}
        onSave={handleSave}
        existingLog={editingLog}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Delay Logs for {taskName}</DialogTitle>
          <DialogDescription>
            View and manage delay logs for {monthName}. Delay logs are displayed as orange bars in the Gantt chart.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {delayLogs.length} delay log{delayLogs.length !== 1 ? 's' : ''} recorded
            </div>
            <Button onClick={handleAddNew} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Log
            </Button>
          </div>

          {delayLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No delay logs recorded yet.</p>
              <p className="text-xs mt-1">Click "Add New Log" to record a delay.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {delayLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border border-border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(log.loggedAt).toLocaleDateString()}
                          </Badge>
                          <Badge variant="secondary">
                            {log.delayDuration} day{log.delayDuration !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Logged by: {log.loggedBy}</p>
                          <p className="text-sm text-muted-foreground mt-1">{log.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(log)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(log.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GanttMini({
  tasks,
  months,
  baseColor,
  subProjects,
  delayLogs,
  onAddDelayLog,
}: {
  tasks: GanttTask[];
  months: string[];
  baseColor: string;
  subProjects?: SubProject[];
  delayLogs?: DelayLog[];
  onAddDelayLog?: (log: DelayLog) => void;
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
  
  // Delay logs list dialog state
  const [delayLogsDialogOpen, setDelayLogsDialogOpen] = useState(false);
  const [selectedTaskForDelay, setSelectedTaskForDelay] = useState<{
    taskId: string;
    taskName: string;
    monthIndex: number;
    monthName: string;
  } | null>(null);

  // Add delay log form dialog state (for clicking on bars)
  const [addLogDialogOpen, setAddLogDialogOpen] = useState(false);
  const [selectedBarForLog, setSelectedBarForLog] = useState<{
    taskId: string;
    taskName: string;
    monthIndex: number;
    monthName: string;
    clickDate?: string; // ISO date string from click position
  } | null>(null);

  const { width } = useWindowSize();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;

  // Get delay logs for a specific task and month
  const getDelayLogsForTask = (taskId: string, monthIndex: number): DelayLog[] => {
    if (!delayLogs) return [];
    return delayLogs.filter(log => log.taskId === taskId && log.monthIndex === monthIndex);
  };

  // Calculate position within month cell based on date
  const getDatePositionInMonth = (delayDate: string, monthIndex: number): number => {
    if (!delayDate) return 0;
    const date = new Date(delayDate);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();
    const dayOfMonth = date.getDate();
    // Return percentage position within the month (0-100%)
    return (dayOfMonth / daysInMonth) * 100;
  };

  // Handle click on Gantt bar to add delay log
  const handleBarClick = (e: React.MouseEvent, taskId: string, taskName: string, monthIndex: number) => {
    e.stopPropagation();
    // Calculate approximate date from click position within the month cell
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const cellWidth = rect.width;
    const clickPercent = (clickX / cellWidth) * 100;
    
    // Estimate date based on click position
    const monthName = months[monthIndex] || 'Jan';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndexNum = monthNames.findIndex(m => monthName.includes(m));
    const currentYear = new Date().getFullYear();
    const daysInMonth = new Date(currentYear, monthIndexNum + 1, 0).getDate();
    const estimatedDay = Math.max(1, Math.min(daysInMonth, Math.round((clickPercent / 100) * daysInMonth)));
    
    const estimatedDate = new Date(currentYear, monthIndexNum, estimatedDay);
    
    setSelectedBarForLog({
      taskId,
      taskName,
      monthIndex,
      monthName,
      clickDate: estimatedDate.toISOString(),
    });
    setAddLogDialogOpen(true);
  };

  // Get sub-project data for a task to check if it's delayed
  const getSubProjectForTask = (taskId: string): SubProject | undefined => {
    return subProjects?.find(sp => sp.id === taskId);
  };

  // Check if task has delay (actual < planned)
  const hasDelay = (task: GanttTask): boolean => {
    const subProject = getSubProjectForTask(task.id);
    if (!subProject) return task.status === "behind";
    return subProject.actualProgress < subProject.plannedProgress;
  };

  const handleOpenDelayLogs = (taskId: string, taskName: string, monthIndex: number) => {
    setSelectedTaskForDelay({
      taskId,
      taskName,
      monthIndex,
      monthName: months[monthIndex] || `Month ${monthIndex + 1}`,
    });
    setDelayLogsDialogOpen(true);
  };

  const handleSaveDelayLog = (log: DelayLog) => {
    if (onAddDelayLog) {
      onAddDelayLog(log);
    }
  };

  const handleDeleteDelayLog = (logId: string) => {
    setDelayLogs((prev) => prev.filter(log => log.id !== logId));
  };

  // Get delay logs for selected task/month
  const getSelectedTaskDelayLogs = (): DelayLog[] => {
    if (!selectedTaskForDelay || !delayLogs) return [];
    return delayLogs.filter(
      log => log.taskId === selectedTaskForDelay.taskId && log.monthIndex === selectedTaskForDelay.monthIndex
    );
  };

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
      {/* Delay Logs List Dialog */}
      {selectedTaskForDelay && (
        <DelayLogsListDialog
          open={delayLogsDialogOpen}
          onOpenChange={setDelayLogsDialogOpen}
          taskName={selectedTaskForDelay.taskName}
          taskId={selectedTaskForDelay.taskId}
          monthIndex={selectedTaskForDelay.monthIndex}
          monthName={selectedTaskForDelay.monthName}
          months={months}
          delayLogs={getSelectedTaskDelayLogs()}
          onSave={handleSaveDelayLog}
          onDelete={handleDeleteDelayLog}
        />
      )}

      {/* Add Delay Log Dialog (from clicking on bar) */}
      {selectedBarForLog && (
        <DelayLogFormDialog
          open={addLogDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setAddLogDialogOpen(false);
              setSelectedBarForLog(null);
            }
          }}
          taskName={selectedBarForLog.taskName}
          taskId={selectedBarForLog.taskId}
          monthIndex={selectedBarForLog.monthIndex}
          monthName={selectedBarForLog.monthName}
          months={months}
          onSave={handleSaveDelayLog}
          defaultDate={selectedBarForLog.clickDate}
        />
      )}

      {/* Legend for delay logs */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/50">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span>Click on Gantt bars to add delay log</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-4 bg-orange-500 rounded" />
          <span>Delay log marker (positioned by date)</span>
        </div>
        {delayLogs && delayLogs.length > 0 && (
          <div className="text-xs">
            {delayLogs.length} delay log{delayLogs.length !== 1 ? 's' : ''} recorded
          </div>
        )}
      </div>

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
                    {months.map((m, monthIdx) => {
                      const taskHasDelay = hasDelay(t);
                      const delayLogsForMonth = getDelayLogsForTask(t.id, monthIdx);
                      const isInTaskRange = monthIdx >= t.startIdx && monthIdx <= t.endIdx;
                      
                      return (
                        <div
                          key={m}
                          className="border-r-2 border-border last:border-r-0 bg-muted/20 relative"
                        >
                          {/* Clickable area to add delay log - only show if task is in range */}
                          {isInTaskRange && (
                            <button
                              type="button"
                              onClick={(e) => handleBarClick(e, t.id, t.name, monthIdx)}
                              className="absolute inset-0 w-full h-full z-10 opacity-0 hover:opacity-5 hover:bg-blue-500 transition-opacity cursor-pointer"
                              title="Click anywhere on this cell to add a delay log"
                            />
                          )}
                          {/* Delay log indicators - positioned based on date within month */}
                          {delayLogsForMonth.length > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 z-25">
                              {delayLogsForMonth.map((log) => {
                                const positionPercent = getDatePositionInMonth(log.delayDate, monthIdx);
                                return (
                                  <div
                                    key={log.id}
                                    className="absolute h-1.5 bg-orange-500 rounded-t border-t border-orange-600"
                                    style={{
                                      left: `${Math.max(0, Math.min(100, positionPercent - 2))}%`,
                                      width: '4%',
                                      minWidth: '2px',
                                    }}
                                    title={`Delay: ${log.reason} (${log.delayDuration} days) - ${new Date(log.delayDate).toLocaleDateString()} - Logged by ${log.loggedBy}`}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Task bar spanning across cells - clickable to add delay logs */}
                  <div
                    className="absolute top-1 bottom-1 flex items-center px-2 rounded shadow-sm z-20"
                    style={{
                      left: `${(t.startIdx / n) * 100}%`,
                      width: `${(span / n) * 100}%`,
                      maxWidth: `calc(100% - ${(t.startIdx / n) * 100}%)`,
                      backgroundColor: statusColor(t.status, baseColor),
                    }}
                    onClick={(e) => {
                      // Calculate which month was clicked
                      const barRect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - barRect.left;
                      const barWidth = barRect.width;
                      const clickPercent = (clickX / barWidth) * 100;
                      const monthIdx = Math.floor((clickPercent / 100) * span) + t.startIdx;
                      const clampedMonthIdx = Math.max(t.startIdx, Math.min(t.endIdx, monthIdx));
                      handleBarClick(e, t.id, t.name, clampedMonthIdx);
                    }}
                    title="Click on the bar to add a delay log at this position"
                  >
                    <div className={`${isMobile ? 'text-[8px]' : 'text-[9px]'} font-semibold text-white truncate flex-1 pointer-events-none`}>
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
                            {months.map((m, monthIdx) => {
                              const childHasDelay = c.status === "behind";
                              const delayLogsForMonth = getDelayLogsForTask(c.id, monthIdx);
                              const isInTaskRange = monthIdx >= c.startIdx && monthIdx <= c.endIdx;
                              
                              return (
                                <div
                                  key={m}
                                  className="border-r-2 border-border last:border-r-0 bg-muted/10 relative"
                                >
                                  {/* Clickable area to add delay log for child tasks */}
                                  {isInTaskRange && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleBarClick(e, c.id, c.name, monthIdx)}
                                      className="absolute inset-0 w-full h-full z-10 opacity-0 hover:opacity-5 hover:bg-blue-500 transition-opacity cursor-pointer"
                                      title="Click anywhere on this cell to add a delay log"
                                    />
                                  )}
                                  {/* Delay log indicators for child tasks - positioned based on date */}
                                  {delayLogsForMonth.length > 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 z-25">
                                      {delayLogsForMonth.map((log) => {
                                        const positionPercent = getDatePositionInMonth(log.delayDate, monthIdx);
                                        return (
                                          <div
                                            key={log.id}
                                            className="absolute h-1 bg-orange-500 rounded-t border-t border-orange-600"
                                            style={{
                                              left: `${Math.max(0, Math.min(100, positionPercent - 2))}%`,
                                              width: '4%',
                                              minWidth: '2px',
                                            }}
                                            title={`Delay: ${log.reason} (${log.delayDuration} days) - ${new Date(log.delayDate).toLocaleDateString()} - Logged by ${log.loggedBy}`}
                                          />
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Child task bar spanning across cells - clickable to add delay logs */}
                          <div
                            className="absolute top-0.5 bottom-0.5 flex items-center px-1.5 rounded z-20"
                            style={{
                              left: `${(c.startIdx / n) * 100}%`,
                              width: `${(childSpan / n) * 100}%`,
                              maxWidth: `calc(100% - ${(c.startIdx / n) * 100}%)`,
                              backgroundColor: statusColor(c.status, baseColor),
                              opacity: 0.75,
                            }}
                            onClick={(e) => {
                              // Calculate which month was clicked
                              const barRect = e.currentTarget.getBoundingClientRect();
                              const clickX = e.clientX - barRect.left;
                              const barWidth = barRect.width;
                              const clickPercent = (clickX / barWidth) * 100;
                              const monthIdx = Math.floor((clickPercent / 100) * childSpan) + c.startIdx;
                              const clampedMonthIdx = Math.max(c.startIdx, Math.min(c.endIdx, monthIdx));
                              handleBarClick(e, c.id, c.name, clampedMonthIdx);
                            }}
                            title="Click on the bar to add a delay log at this position"
                          >
                            <div className={`${isMobile ? 'text-[7px]' : 'text-[8px]'} font-medium text-white truncate flex-1 pointer-events-none`}>
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
  const [tab, setTab] = useState<"gantt" | "wbs" | "scurves" | "logs">("gantt");
  
  // State for editing delay log from table
  const [editingLogFromTable, setEditingLogFromTable] = useState<DelayLog | undefined>(undefined);
  const [showEditForm, setShowEditForm] = useState(false);
  const { width } = useWindowSize();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;

  const subProjects = phase.subProjects ?? [];
  const timeline = phase.timeline ?? [];
  const months = useMemo(() => timeline.map((t) => t.month), [timeline]);

  const ganttTasks = useMemo(() => buildGanttTasks(subProjects, months), [subProjects, months]);

  // Delay logs state - stored per milestone
  const [delayLogs, setDelayLogs] = useState<DelayLog[]>([]);

  const handleAddDelayLog = (log: DelayLog) => {
    setDelayLogs((prev) => {
      // If log has existing ID, update it; otherwise add new
      const existingIndex = prev.findIndex(l => l.id === log.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = log;
        return updated;
      }
      return [...prev, log];
    });
  };

  const handleDeleteDelayLog = (logId: string) => {
    setDelayLogs((prev) => prev.filter(log => log.id !== logId));
  };

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
              Gantt plan, WBS breakdown, S-curves, and delay logs for this milestone.
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
                <GanttMini 
                  tasks={ganttTasks} 
                  months={months} 
                  baseColor={phaseColor}
                  subProjects={subProjects}
                  delayLogs={delayLogs}
                  onAddDelayLog={handleAddDelayLog}
                />
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
            <TabsList className={`w-full ${isMobile ? 'grid grid-cols-4' : 'justify-start'}`}>
              <TabsTrigger value="gantt" className={isMobile ? 'text-xs' : ''}>Gantt</TabsTrigger>
              <TabsTrigger value="wbs" className={isMobile ? 'text-xs' : ''}>WBS Breakdown</TabsTrigger>
              <TabsTrigger value="scurves" className={isMobile ? 'text-xs' : ''}>S-Curves</TabsTrigger>
              <TabsTrigger value="logs" className={isMobile ? 'text-xs' : ''}>Delay Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="gantt" className="mt-4">
              <GanttMini 
                tasks={ganttTasks} 
                months={months} 
                baseColor={phaseColor}
                subProjects={subProjects}
                delayLogs={delayLogs}
                onAddDelayLog={handleAddDelayLog}
              />
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

            <TabsContent value="logs" className="mt-4">
              <DelayLogsTable
                delayLogs={delayLogs}
                ganttTasks={ganttTasks}
                subProjects={subProjects}
                months={months}
                onEdit={(log) => {
                  setEditingLogFromTable(log);
                  setShowEditForm(true);
                }}
                onDelete={handleDeleteDelayLog}
                isMobile={isMobile}
                isTablet={isTablet}
              />
              {/* Edit form dialog */}
              {editingLogFromTable && (
                <DelayLogFormDialog
                  open={showEditForm}
                  onOpenChange={(open) => {
                    if (!open) {
                      setShowEditForm(false);
                      setEditingLogFromTable(undefined);
                    }
                  }}
                  taskName={editingLogFromTable.taskId}
                  taskId={editingLogFromTable.taskId}
                  monthIndex={editingLogFromTable.monthIndex}
                  monthName={months[editingLogFromTable.monthIndex] || `Month ${editingLogFromTable.monthIndex + 1}`}
                  months={months}
                  onSave={(log) => {
                    handleAddDelayLog(log);
                    setShowEditForm(false);
                    setEditingLogFromTable(undefined);
                  }}
                  existingLog={editingLogFromTable}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}


