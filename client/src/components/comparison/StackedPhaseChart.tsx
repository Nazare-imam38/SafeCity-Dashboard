import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StackedPhaseChartProps {
  data: {
    city: string;
    surveys: number;
    foundations: number;
    cabinet: number;
    cable: number;
    controlRoom: number;
    ppic3: number;
  }[];
}

const PHASE_COLORS = {
  surveys: "#3b82f6",
  foundations: "#10b981",
  cabinet: "#f59e0b",
  cable: "#a855f7",
  controlRoom: "#ef4444",
  ppic3: "#eab308",
};

export function StackedPhaseChart({ data }: StackedPhaseChartProps) {
  const sortedData = [...data].sort((a, b) => {
    const totalA = a.surveys + a.foundations + a.cabinet + a.cable + a.controlRoom + a.ppic3;
    const totalB = b.surveys + b.foundations + b.cabinet + b.cable + b.controlRoom + b.ppic3;
    return totalB - totalA;
  });

  return (
    <Card className="shadow-lg border-border/50 border-2 transition-colors hover:border-[#101a3c]">
      <CardHeader className="pb-4">
        <CardTitle className="font-heading text-xl font-bold">Phase Progress Comparison</CardTitle>
        <CardDescription className="text-sm">Stacked view of all installation phases by city</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={sortedData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="city" 
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              interval={0}
            />
            <YAxis 
              domain={[0, 600]}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Total Progress", angle: -90, position: "insideLeft" }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                borderColor: "hsl(var(--border))", 
                borderRadius: "8px" 
              }}
              formatter={(value: number, name: string) => [`${value}%`, name]}
            />
            <Legend />
            <Bar dataKey="surveys" stackId="a" fill={PHASE_COLORS.surveys} />
            <Bar dataKey="foundations" stackId="a" fill={PHASE_COLORS.foundations} />
            <Bar dataKey="cabinet" stackId="a" fill={PHASE_COLORS.cabinet} />
            <Bar dataKey="cable" stackId="a" fill={PHASE_COLORS.cable} />
            <Bar dataKey="controlRoom" stackId="a" fill={PHASE_COLORS.controlRoom} />
            <Bar dataKey="ppic3" stackId="a" fill={PHASE_COLORS.ppic3} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

