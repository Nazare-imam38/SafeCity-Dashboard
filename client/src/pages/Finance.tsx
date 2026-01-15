import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Wallet, AlertCircle, CheckCircle2 } from "lucide-react";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

// PKR conversion rate (approximate)
const USD_TO_PKR = 280;

// Format PKR currency
const formatPKR = (amount: number) => {
  if (amount >= 10000000) {
    return `PKR ${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `PKR ${(amount / 100000).toFixed(2)} L`;
  } else {
    return `PKR ${amount.toLocaleString()}`;
  }
};

// Budget data with PKR values
const budgetData = [
  { month: 'Jan', planned: 1120000000, actual: 1064000000, variance: -56000000 },
  { month: 'Feb', planned: 840000000, actual: 896000000, variance: 56000000 },
  { month: 'Mar', planned: 560000000, actual: 504000000, variance: -56000000 },
  { month: 'Apr', planned: 778400000, actual: 812000000, variance: 33600000 },
  { month: 'May', planned: 529200000, actual: 532000000, variance: 2800000 },
  { month: 'Jun', planned: 669200000, actual: 616000000, variance: -53200000 },
  { month: 'Jul', planned: 977200000, actual: 952000000, variance: -25200000 },
];

// Department expense data
const expenseData = [
  { department: "Infrastructure", planned: 1260000000, actual: 1190000000, color: "#3b82f6" },
  { department: "Personnel", planned: 896000000, actual: 840000000, color: "#10b981" },
  { department: "Maintenance", planned: 336000000, actual: 308000000, color: "#f59e0b" },
  { department: "Software Licenses", planned: 224000000, actual: 196000000, color: "#a855f7" },
];

// KPI Data
const kpiData = {
  totalBudget: { value: 3500000000, label: "Total Budget Allocated", icon: Wallet, trend: 2.5 },
  ytdUtilization: { value: 2296000000, label: "YTD Utilization", icon: DollarSign, trend: 65.6 },
  variance: { value: -42000000, label: "Projected Variance", icon: AlertCircle, trend: -1.2 },
  remaining: { value: 1204000000, label: "Remaining Budget", icon: CheckCircle2, trend: 34.4 },
};

export default function Finance() {
  const totalPlanned = budgetData.reduce((sum, item) => sum + item.planned, 0);
  const totalActual = budgetData.reduce((sum, item) => sum + item.actual, 0);
  const utilizationRate = (totalActual / totalPlanned) * 100;

  return (
    <Layout title="Financial & Budget Analytics">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold font-heading">FY 2025-26 Financial Overview</h2>
          <p className="text-muted-foreground">Track budget allocation, utilization, and variance analysis in PKR</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(kpiData).map(([key, kpi]) => {
            const Icon = kpi.icon;
            const isPositive = kpi.trend >= 0;
            const isVariance = key === 'variance';
            
            return (
              <Card key={key} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12"></div>
                <CardHeader className="pb-2 relative">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className={`text-2xl font-bold font-heading ${isVariance && kpi.value < 0 ? 'text-emerald-500' : isVariance ? 'text-red-500' : ''}`}>
                    {formatPKR(Math.abs(kpi.value))}
                  </div>
                  {!isVariance && (
                    <div className="flex items-center gap-1 mt-2">
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <p className={`text-xs ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                        {Math.abs(kpi.trend)}% {key === 'ytdUtilization' ? 'Utilized' : 'from last year'}
                      </p>
                    </div>
                  )}
                  {isVariance && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {kpi.value < 0 ? 'Under budget (Good)' : 'Over budget'}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Budget vs Actual Charts */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main Budget vs Actual Chart */}
          <Card className="lg:col-span-8">
            <CardHeader>
              <CardTitle>Planned vs Actual Budget</CardTitle>
              <CardDescription>Monthly budget comparison in PKR</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={budgetData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => `${(value / 100000000).toFixed(1)}Cr`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      borderColor: "hsl(var(--border))", 
                      borderRadius: "8px" 
                    }}
                    formatter={(value: number, name: string) => [
                      formatPKR(value),
                      name === 'planned' ? 'Planned' : name === 'actual' ? 'Actual' : 'Variance'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="planned" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Planned" />
                  <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} name="Actual" />
                  <Line 
                    type="monotone" 
                    dataKey="variance" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Variance"
                    dot={{ fill: "#ef4444", r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Utilization Progress */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Budget Utilization</CardTitle>
              <CardDescription>Overall progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Utilized</span>
                  <span className="font-bold">{utilizationRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${utilizationRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatPKR(totalActual)}</span>
                  <span>{formatPKR(totalPlanned)}</span>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Remaining</span>
                    <span className="font-bold text-emerald-600">
                      {formatPKR(totalPlanned - totalActual)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Variance</span>
                    <span className={`font-bold ${totalActual < totalPlanned ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatPKR(totalActual - totalPlanned)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department Expense Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Department Budget Analysis</CardTitle>
            <CardDescription>Planned vs Actual expenses by department</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={expenseData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="department" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => `${(value / 100000000).toFixed(1)}Cr`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderColor: "hsl(var(--border))", 
                    borderRadius: "8px" 
                  }}
                  formatter={(value: number, name: string) => [
                    formatPKR(value),
                    name === 'planned' ? 'Planned' : 'Actual'
                  ]}
                />
                <Legend />
                <Bar dataKey="planned" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Planned" />
                <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} name="Actual" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Drill-down */}
        <Card>
          <CardHeader>
            <CardTitle>Department Expense Breakdown</CardTitle>
            <CardDescription>Detailed expense categorization in PKR</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {expenseData.map((item) => {
                const utilization = (item.actual / item.planned) * 100;
                const variance = item.actual - item.planned;
                
                return (
                  <div key={item.department} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold">{item.department}</span>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-mono text-xs text-muted-foreground">Planned: {formatPKR(item.planned)}</div>
                          <div className="font-mono font-bold">Actual: {formatPKR(item.actual)}</div>
                        </div>
                        <div className={`text-sm font-bold ${variance < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {variance < 0 ? '-' : '+'}{formatPKR(Math.abs(variance))}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${utilization}%`,
                          backgroundColor: item.color 
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{utilization.toFixed(1)}% Utilized</span>
                      <span>{variance < 0 ? 'Under' : 'Over'} Budget</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
