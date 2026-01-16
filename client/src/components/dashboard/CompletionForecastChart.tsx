import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CompletionForecastChartProps {
  currentProgress: number;
  cityKey?: string;
}

export function CompletionForecastChart({ currentProgress, cityKey = "default" }: CompletionForecastChartProps) {
  // Generate forecast data based on current progress
  const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = "Jun";
  
  // Calculate forecast based on current progress rate
  const progressRate = currentProgress / 6; // Average monthly progress
  const remainingMonths = months.length;
  
  const forecastData = [
    { month: currentMonth, progress: currentProgress, type: "Actual" },
    ...months.map((month, index) => {
      const projected = Math.min(100, currentProgress + (progressRate * (index + 1)));
      return {
        month,
        progress: Math.round(projected),
        type: "Forecast"
      };
    })
  ];

  const gradientId = `forecastGradient-${cityKey}`;

  return (
    <Card className="shadow-lg border-border/50 border-2 transition-colors hover:border-[#101a3c]">
      <CardHeader className="pb-4">
        <CardTitle className="font-heading text-xl font-bold">Completion Forecast</CardTitle>
        <CardDescription className="text-sm">Projected completion timeline based on current progress rate</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} key={cityKey}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
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
              formatter={(value: number) => [`${value}%`, "Progress"]}
            />
            <ReferenceLine y={100} stroke="#10b981" strokeDasharray="5 5" label={{ value: "Target", position: "right" }} />
            <Line 
              type="monotone" 
              dataKey="progress" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: "#10b981", r: 5 }}
              activeDot={{ r: 7 }}
              strokeDasharray={forecastData[0].type === "Actual" ? "0" : "5 5"}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span>Projected Completion</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-emerald-300"></div>
            <span>Current Progress</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

