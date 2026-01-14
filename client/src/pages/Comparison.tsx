import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const comparisonData = [
  { metric: "Response Time (min)", Lahore: 8, Rawalpindi: 10, Faisalabad: 12 },
  { metric: "Incidents (Daily)", Lahore: 120, Rawalpindi: 85, Faisalabad: 90 },
  { metric: "Staff Count", Lahore: 1450, Rawalpindi: 800, Faisalabad: 750 },
  { metric: "Camera Uptime %", Lahore: 98, Rawalpindi: 95, Faisalabad: 92 },
];

export default function Comparison() {
  return (
    <Layout title="Cross-City Comparison">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Compare performance metrics across major districts.</p>
          <div className="flex gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Add City to Compare" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Major Cities</SelectItem>
                <SelectItem value="lhr">Lahore</SelectItem>
                <SelectItem value="rwp">Rawalpindi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Rankings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Ranking</CardTitle>
              <CardDescription>Based on weighted efficiency score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { city: "Lahore", score: 92, trend: "+2%" },
                  { city: "Rawalpindi", score: 88, trend: "-1%" },
                  { city: "Faisalabad", score: 85, trend: "+4%" },
                  { city: "Multan", score: 81, trend: "0%" },
                ].map((item, i) => (
                  <div key={item.city} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <div className="flex items-center gap-3">
                      <div className="font-heading font-bold text-xl text-muted-foreground w-6">#{i + 1}</div>
                      <div>
                        <p className="font-bold">{item.city}</p>
                        <p className="text-xs text-muted-foreground">Efficiency Score</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-heading font-bold text-lg text-primary">{item.score}</p>
                      <p className={`text-xs ${item.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{item.trend}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Incident Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Response Time Comparison</CardTitle>
              <CardDescription>Average minutes per priority incident</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData.filter(d => d.metric === "Response Time (min)")} layout="vertical">
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                   <XAxis type="number" hide />
                   <YAxis type="category" dataKey="metric" hide />
                   <Tooltip cursor={{fill: 'transparent'}} />
                   <Legend />
                   <Bar dataKey="Lahore" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                   <Bar dataKey="Rawalpindi" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} barSize={20} />
                   <Bar dataKey="Faisalabad" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                 <div>
                   <p className="text-sm font-medium">Lahore</p>
                   <p className="text-2xl font-bold font-heading text-primary">8m</p>
                 </div>
                 <div>
                   <p className="text-sm font-medium">Rawalpindi</p>
                   <p className="text-2xl font-bold font-heading text-[hsl(var(--chart-2))]">10m</p>
                 </div>
                 <div>
                   <p className="text-sm font-medium">Faisalabad</p>
                   <p className="text-2xl font-bold font-heading text-[hsl(var(--chart-3))]">12m</p>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Chart */}
        <Card>
           <CardHeader>
             <CardTitle>Metric Overview</CardTitle>
           </CardHeader>
           <CardContent className="h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
                   <XAxis dataKey="metric" />
                   <YAxis />
                   <Tooltip />
                   <Legend />
                   <Bar dataKey="Lahore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                   <Bar dataKey="Rawalpindi" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                   <Bar dataKey="Faisalabad" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
           </CardContent>
        </Card>
      </div>
    </Layout>
  );
}