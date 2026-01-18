import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TimelinePoint {
  month: string;
  actual: number;
  planned: number;
}

interface PlannedVsActualChartProps {
  timelineData?: TimelinePoint[];
  phaseName: string;
  color: string;
}

export function PlannedVsActualChart({ timelineData, phaseName, color }: PlannedVsActualChartProps) {
  if (!timelineData || timelineData.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg border-border/50 border-2 transition-colors hover:border-[#101a3c]">
      <CardHeader className="pb-4">
        <CardTitle className="font-heading text-xl font-bold">Planned vs Actual Progress</CardTitle>
        <CardDescription className="text-sm">{phaseName} - Timeline Comparison</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
            />
            <YAxis 
              domain={[0, 100]}
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                borderColor: "hsl(var(--border))", 
                borderRadius: "8px" 
              }}
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}%`, 
                name === "actual" ? "Actual Progress" : "Planned Progress"
              ]}
            />
            <Legend 
              formatter={(value: string) => value === "actual" ? "Actual Progress" : "Planned Progress"}
            />
            <Line 
              type="monotone" 
              dataKey="planned" 
              stroke={color}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: color, r: 4 }}
              name="planned"
            />
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke={color}
              strokeWidth={3}
              dot={{ fill: color, r: 5 }}
              name="actual"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

