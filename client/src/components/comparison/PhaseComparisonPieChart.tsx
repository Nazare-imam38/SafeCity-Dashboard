import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PhaseComparisonPieChartProps {
  phaseName: string;
  cityData: {
    city: string;
    value: number;
  }[];
}

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ef4444", 
  "#eab308", "#06b6d4", "#8b5cf6", "#f97316", "#ec4899"
];

export function PhaseComparisonPieChart({ phaseName, cityData }: PhaseComparisonPieChartProps) {
  const sortedData = [...cityData].sort((a, b) => b.value - a.value).slice(0, 6); // Top 6 cities

  return (
    <Card className="shadow-lg border-border/50 border-2 transition-colors hover:border-[#101a3c]">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-lg font-bold">{phaseName}</CardTitle>
        <CardDescription className="text-sm">Top 6 cities comparison</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pie Chart */}
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={sortedData}
              cx="50%"
              cy="50%"
              label={false}
              outerRadius={100}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={3}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                borderColor: "hsl(var(--border))", 
                borderRadius: "8px",
                padding: "8px 12px"
              }}
              formatter={(value: number, name: string, props: any) => [
                `${props.payload.city}: ${value}%`,
                "Progress"
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend with City Names */}
        <div className="flex flex-wrap justify-center gap-3 text-xs">
          {sortedData.map((entry, index) => (
            <div key={entry.city} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-muted-foreground font-medium">
                {entry.city}: {entry.value}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
