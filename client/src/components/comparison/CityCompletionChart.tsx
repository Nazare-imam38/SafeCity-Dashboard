import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CityCompletionChartProps {
  cityData: {
    city: string;
    completion: number;
  }[];
}

const getColor = (completion: number): string => {
  if (completion >= 80) return "#10b981"; // emerald
  if (completion >= 60) return "#3b82f6"; // blue
  if (completion >= 40) return "#f59e0b"; // orange
  return "#ef4444"; // red
};

export function CityCompletionChart({ cityData }: CityCompletionChartProps) {
  const sortedData = [...cityData].sort((a, b) => b.completion - a.completion);

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="font-heading text-xl font-bold">Smart Safe Cities Phase I (Completion %)</CardTitle>
        <CardDescription className="text-sm">District Wise Progress</CardDescription>
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
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.completion)} />
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

