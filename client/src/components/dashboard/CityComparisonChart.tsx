import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface CityComparisonChartProps {
  cityData: Record<string, { overall: number; name: string }>;
  selectedCity?: string;
}

export function CityComparisonChart({ cityData, selectedCity }: CityComparisonChartProps) {
  const chartData = Object.entries(cityData)
    .map(([key, data]) => ({
      city: data.name,
      progress: data.overall,
    }))
    .sort((a, b) => b.progress - a.progress);

  const getColor = (progress: number): string => {
    if (progress >= 80) return "#10b981";
    if (progress >= 60) return "#3b82f6";
    if (progress >= 40) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <Card className="shadow-lg border-border/50 border-2 transition-colors hover:border-[#101a3c]">
      <CardHeader className="pb-4">
        <CardTitle className="font-heading text-xl font-bold">City Comparison</CardTitle>
        <CardDescription className="text-sm">Overall installation progress across all cities</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }} key={selectedCity}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="city" 
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
              formatter={(value: number) => [`${value}%`, "Overall Progress"]}
            />
            <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.progress)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

