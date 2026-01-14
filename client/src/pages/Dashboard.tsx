import { Layout } from "@/components/layout/Layout";
import { KPICard } from "@/components/dashboard/KPICard";
import { CityMap } from "@/components/dashboard/CityMap";
import { IncidentList } from "@/components/dashboard/IncidentList";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { AlertCircle, Car, Users, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dashboard() {
  return (
    <Layout title="Real-time City Monitor">
      <div className="flex flex-col gap-6">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select defaultValue="lahore">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lahore">Lahore</SelectItem>
              <SelectItem value="rawalpindi">Rawalpindi</SelectItem>
              <SelectItem value="faisalabad">Faisalabad</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              <SelectItem value="north">North Zone</SelectItem>
              <SelectItem value="south">South Zone</SelectItem>
              <SelectItem value="central">Central</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard 
            title="Active Incidents" 
            value="124" 
            trend={12} 
            icon={AlertCircle} 
            className="border-l-4 border-l-destructive"
          />
          <KPICard 
            title="Response Time" 
            value="8m 32s" 
            trend={-5} 
            trendLabel="improvement"
            icon={Clock}
            className="border-l-4 border-l-emerald-500"
          />
          <KPICard 
            title="Traffic Congestion" 
            value="High" 
            trend={2} 
            icon={Car}
            className="border-l-4 border-l-orange-500"
          />
          <KPICard 
            title="Staff Deployed" 
            value="1,450" 
            trend={0} 
            icon={Users}
            className="border-l-4 border-l-blue-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 h-full">
          {/* Map Section - Takes up 2 cols on md, 3 on lg */}
          <div className="md:col-span-2 lg:col-span-3 space-y-6">
            <CityMap />
            <TrendChart />
          </div>
          
          {/* Sidebar Panel - Takes up 1 col */}
          <div className="md:col-span-1 lg:col-span-1">
            <IncidentList />
          </div>
        </div>
      </div>
    </Layout>
  );
}