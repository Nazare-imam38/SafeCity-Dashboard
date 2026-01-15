import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityProgressChartProps {
  cityName: string;
  activityData: {
    activity: string;
    completion: number;
  }[];
}

const COLORS = {
  surveys: "#3b82f6",
  foundations: "#10b981",
  cabinet: "#f59e0b",
  cable: "#a855f7",
  controlRoom: "#ef4444",
  ppic3: "#eab308",
};

const getColor = (activity: string): string => {
  const key = activity.toLowerCase();
  if (key.includes("survey")) return COLORS.surveys;
  if (key.includes("foundation") || key.includes("pole")) return COLORS.foundations;
  if (key.includes("cabinet")) return COLORS.cabinet;
  if (key.includes("cable")) return COLORS.cable;
  if (key.includes("control")) return COLORS.controlRoom;
  if (key.includes("ppic")) return COLORS.ppic3;
  return "#6b7280";
};

export function ActivityProgressChart({ cityName, activityData }: ActivityProgressChartProps) {
  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="font-heading text-xl font-bold">Smart Safe Cities Phase I (Completion %)</CardTitle>
        <CardDescription className="text-sm">District Wise Progress {cityName}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart 
            data={activityData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="activity" 
              angle={-45}
              textAnchor="end"
              height={120}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              interval={0}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Completion %", angle: -90, position: "insideLeft" }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                borderColor: "hsl(var(--border))", 
                borderRadius: "8px" 
              }}
              formatter={(value: number) => [`${value}%`, "Completion"]}
            />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
            />
            <Bar dataKey="completion" radius={[4, 4, 0, 0]}>
              {activityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.activity)} />
              ))}
              <LabelList 
                dataKey="completion" 
                position="top" 
                formatter={(value: number) => `${value}%`}
                style={{ fontSize: "11px", fill: "hsl(var(--foreground))", fontWeight: "bold" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

