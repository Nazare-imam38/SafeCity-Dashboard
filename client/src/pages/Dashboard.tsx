import { Layout } from "@/components/layout/Layout";
import { KPICard } from "@/components/dashboard/KPICard";
import { CityMap } from "@/components/dashboard/CityMap";
import { IncidentList } from "@/components/dashboard/IncidentList";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { AlertCircle, Car, Users, Clock, Camera } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  return (
    <Layout title="City Control Center">
      <div className="flex flex-col gap-6">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-primary/10 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold font-heading">Lahore Metropolitan</h2>
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Zone A-1 (Central)</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Monitoring active for 1,240,000 residents • 4,500 active cameras</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select defaultValue="lahore">
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lahore">Lahore</SelectItem>
                <SelectItem value="rawalpindi">Rawalpindi</SelectItem>
                <SelectItem value="faisalabad">Faisalabad</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                <SelectItem value="north">North Zone</SelectItem>
                <SelectItem value="south">South Zone</SelectItem>
                <SelectItem value="central">Central</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard 
            title="Active Incidents" 
            value="124" 
            trend={12} 
            icon={AlertCircle} 
            className="border-b-4 border-b-destructive hover:shadow-lg transition-shadow"
          />
          <KPICard 
            title="Avg Response" 
            value="08m 32s" 
            trend={-5} 
            trendLabel="improvement"
            icon={Clock}
            className="border-b-4 border-b-emerald-500 hover:shadow-lg transition-shadow"
          />
          <KPICard 
            title="Traffic Index" 
            value="Moderate" 
            trend={2} 
            icon={Car}
            className="border-b-4 border-b-orange-500 hover:shadow-lg transition-shadow"
          />
          <KPICard 
            title="Uptime (CCTV)" 
            value="98.4%" 
            trend={0.2} 
            icon={Camera}
            className="border-b-4 border-b-blue-500 hover:shadow-lg transition-shadow"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Map & Chart Section */}
          <div className="lg:col-span-8 space-y-6">
            <CityMap />
            <TrendChart />
          </div>
          
          {/* Side Panels */}
          <div className="lg:col-span-4 space-y-6">
            <IncidentList />
            
            {/* Quick Actions / System Health */}
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Patrol Status
              </h3>
              <div className="space-y-4">
                 {[
                   { name: "Dolphin Force", active: 450, total: 500 },
                   { name: "Traffic Police", active: 820, total: 900 },
                   { name: "Emergency Units", active: 115, total: 120 },
                 ].map((unit) => (
                   <div key={unit.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{unit.name}</span>
                        <span className="font-mono">{unit.active}/{unit.total}</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${(unit.active/unit.total)*100}%` }}
                        />
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}