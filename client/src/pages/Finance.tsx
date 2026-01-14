import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const budgetData = [
  { month: 'Jan', budget: 4000, actual: 3800 },
  { month: 'Feb', budget: 3000, actual: 3200 },
  { month: 'Mar', budget: 2000, actual: 1800 },
  { month: 'Apr', budget: 2780, actual: 2900 },
  { month: 'May', budget: 1890, actual: 1900 },
  { month: 'Jun', budget: 2390, actual: 2200 },
  { month: 'Jul', budget: 3490, actual: 3400 },
];

const expenseData = [
  { department: "Infrastructure", amount: 45000, color: "hsl(var(--primary))" },
  { department: "Personnel", amount: 32000, color: "hsl(var(--chart-2))" },
  { department: "Maintenance", amount: 12000, color: "hsl(var(--chart-3))" },
  { department: "Software Lic", amount: 8000, color: "hsl(var(--chart-4))" },
];

export default function Finance() {
  return (
    <Layout title="Financial & Budget Analytics">
       <div className="flex flex-col gap-6">
         <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold font-heading">FY 2025-26 Overview</h2>
              <p className="text-muted-foreground">Track budget allocation and utilization.</p>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export Report
            </Button>
         </div>

         <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget Allocated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-heading">$12.5M</div>
                <p className="text-xs text-muted-foreground mt-1">+2.5% from last year</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">YTD Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-heading">$8.2M</div>
                <div className="w-full bg-secondary h-2 rounded-full mt-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">65% Utilized</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Projected Variance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-heading text-emerald-500">-$150K</div>
                <p className="text-xs text-muted-foreground mt-1">Under budget (Good)</p>
              </CardContent>
            </Card>
         </div>

         <div className="grid gap-6 md:grid-cols-2">
            <Card className="col-span-2 md:col-span-1">
               <CardHeader>
                 <CardTitle>Budget vs Actual</CardTitle>
                 <CardDescription>Monthly breakdown</CardDescription>
               </CardHeader>
               <CardContent className="h-[350px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <ComposedChart data={budgetData}>
                     <CartesianGrid stroke="#f5f5f5" vertical={false} />
                     <XAxis dataKey="month" scale="band" />
                     <YAxis />
                     <Tooltip />
                     <Legend />
                     <Bar dataKey="budget" barSize={20} fill="hsl(var(--primary))" />
                     <Line type="monotone" dataKey="actual" stroke="hsl(var(--destructive))" strokeWidth={2} />
                   </ComposedChart>
                 </ResponsiveContainer>
               </CardContent>
            </Card>

            <Card className="col-span-2 md:col-span-1">
               <CardHeader>
                 <CardTitle>Department Drill-down</CardTitle>
                 <CardDescription>Expense categorization</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-6">
                   {expenseData.map((item) => (
                     <div key={item.department} className="space-y-2">
                       <div className="flex justify-between text-sm">
                         <span className="font-medium">{item.department}</span>
                         <span className="font-mono">${item.amount.toLocaleString()}</span>
                       </div>
                       <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                         <div 
                           className="h-full rounded-full" 
                           style={{ 
                             width: `${(item.amount / 50000) * 100}%`,
                             backgroundColor: item.color 
                           }}
                         />
                       </div>
                     </div>
                   ))}
                 </div>
               </CardContent>
            </Card>
         </div>
       </div>
    </Layout>
  );
}