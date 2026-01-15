import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface PhaseData {
  phase: string;
  percentage: number;
}

interface PhaseBreakdownChartProps {
  data: PhaseData[];
}

const COLORS = {
  surveys: "#3b82f6",
  foundations: "#10b981",
  cabinet: "#f59e0b",
  cable: "#a855f7",
  controlRoom: "#ef4444",
  ppic3: "#eab308",
};

const getColor = (phase: string): string => {
  const key = phase.toLowerCase().replace(/\s+/g, "");
  if (key.includes("survey")) return COLORS.surveys;
  if (key.includes("foundation")) return COLORS.foundations;
  if (key.includes("cabinet")) return COLORS.cabinet;
  if (key.includes("cable")) return COLORS.cable;
  if (key.includes("control")) return COLORS.controlRoom;
  if (key.includes("ppic")) return COLORS.ppic3;
  return "#6b7280";
};

export function PhaseBreakdownChart({ data }: PhaseBreakdownChartProps) {
  const chartData = data.map(item => ({
    ...item,
    phase: item.phase.length > 20 ? item.phase.substring(0, 20) + "..." : item.phase,
  }));

  // Create a unique key based on data to force re-render
  const dataKey = JSON.stringify(data);

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="font-heading text-xl font-bold">Phase Breakdown</CardTitle>
        <CardDescription className="text-sm">Installation progress by phase</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }} key={dataKey}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="phase" 
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                borderColor: "hsl(var(--border))", 
                borderRadius: "8px" 
              }}
              formatter={(value: number) => [`${value}%`, "Progress"]}
            />
            <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.phase)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

