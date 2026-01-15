import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface HeatmapChartProps {
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

const getColorIntensity = (value: number): string => {
  if (value >= 90) return "bg-emerald-600";
  if (value >= 80) return "bg-emerald-500";
  if (value >= 70) return "bg-blue-500";
  if (value >= 60) return "bg-blue-400";
  if (value >= 50) return "bg-orange-400";
  if (value >= 40) return "bg-orange-500";
  if (value >= 30) return "bg-red-500";
  return "bg-red-600";
};

export function HeatmapChart({ data }: HeatmapChartProps) {
  const phases = [
    { key: "surveys", label: "Surveys" },
    { key: "foundations", label: "Foundations" },
    { key: "cabinet", label: "Cabinet" },
    { key: "cable", label: "Cable" },
    { key: "controlRoom", label: "Control Room" },
    { key: "ppic3", label: "PPIC3" },
  ];

  const sortedData = [...data].sort((a, b) => {
    const avgA = (a.surveys + a.foundations + a.cabinet + a.cable + a.controlRoom + a.ppic3) / 6;
    const avgB = (b.surveys + b.foundations + b.cabinet + b.cable + b.controlRoom + b.ppic3) / 6;
    return avgB - avgA;
  });

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="font-heading text-xl font-bold">Progress Heatmap</CardTitle>
        <CardDescription className="text-sm">Visual comparison of all phases across all cities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 font-semibold text-sm border-b sticky left-0 bg-card z-10">City</th>
                  {phases.map((phase) => (
                    <th key={phase.key} className="text-center p-3 font-semibold text-sm border-b min-w-[100px]">
                      {phase.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedData.map((city, index) => (
                  <tr key={city.city} className={index % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="p-3 font-semibold text-sm border-b sticky left-0 bg-inherit z-10">
                      {city.city}
                    </td>
                    {phases.map((phase) => {
                      const value = city[phase.key as keyof typeof city] as number;
                      return (
                        <td key={phase.key} className="p-3 text-center border-b">
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-16 h-8 rounded ${getColorIntensity(value)} flex items-center justify-center`}>
                              <span className="text-white text-xs font-bold">{value}%</span>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

