import { Layout } from "@/components/layout/Layout";
import { KPICard } from "@/components/dashboard/KPICard";
import { CityMap } from "@/components/dashboard/CityMap";
import { IncidentList } from "@/components/dashboard/IncidentList";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { AlertCircle, Car, Users, Clock, Camera, Construction, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import pptxgen from "pptxgenjs";

const CITY_STATS: Record<string, any> = {
  lahore: {
    incidents: "124",
    responseTime: "08m 32s",
    traffic: "Moderate",
    construction: "8 Active",
    population: "1,240,000",
    cameras: "4,500"
  },
  rawalpindi: {
    incidents: "85",
    responseTime: "10m 15s",
    traffic: "Low",
    construction: "3 Active",
    population: "850,000",
    cameras: "2,100"
  },
  gujranwala: {
    incidents: "92",
    responseTime: "12m 45s",
    traffic: "High",
    construction: "5 Active",
    population: "750,000",
    cameras: "1,800"
  }
};

export default function Dashboard() {
  const [selectedCity, setSelectedCity] = useState("lahore");
  const stats = CITY_STATS[selectedCity] || CITY_STATS.lahore;

  const handleDownloadPPT = () => {
    const pres = new pptxgen();
    const slide = pres.addSlide();
    
    // Add City Title
    slide.addText(`PSCA - ${selectedCity.toUpperCase()} City Report`, {
      x: 0.5, y: 0.5, w: "90%", h: 1,
      fontSize: 24, bold: true, color: "1A365D", align: "center", fontFace: "Rajdhani"
    });

    // Add Stats Cards Layout
    const metrics = [
      { label: "Active Incidents", value: stats.incidents },
      { label: "Response Time", value: stats.responseTime },
      { label: "Construction Sites", value: stats.construction },
      { label: "Active Cameras", value: stats.cameras }
    ];

    metrics.forEach((m, idx) => {
      slide.addShape(pres.ShapeType.rect, {
        x: 0.5 + (idx * 2.3), y: 2, w: 2.1, h: 1.5,
        fill: { color: "F7FAFC" }, line: { color: "E2E8F0", width: 1 }
      });
      slide.addText(m.label, {
        x: 0.6 + (idx * 2.3), y: 2.2, w: 1.9, h: 0.3,
        fontSize: 10, color: "718096", align: "center", bold: true
      });
      slide.addText(m.value, {
        x: 0.6 + (idx * 2.3), y: 2.7, w: 1.9, h: 0.5,
        fontSize: 18, color: "2D3748", align: "center", bold: true
      });
    });

    // Add PSCA Logo Mock (Placeholder text for logo positioning as per user requirement)
    slide.addText("PSCA SAFE CITY PORTAL", {
      x: 7.5, y: 5.2, w: 2, h: 0.4,
      fontSize: 10, color: "E53E3E", align: "right", bold: true
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 8.5, y: 4.8, w: 1, h: 0.4,
      fill: { color: "1A365D" }
    });

    pres.writeFile({ fileName: `PSCA_${selectedCity}_Report.pptx` });
  };

  return (
    <Layout title="City Control Center">
      <div className="flex flex-col gap-6">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-primary/10 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold font-heading capitalize">{selectedCity} Metropolitan</h2>
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Zone A-1 (Central)</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Monitoring active for {stats.population} residents • {stats.cameras} active cameras</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleDownloadPPT} className="bg-secondary/10 text-secondary border-secondary/20 font-bold hover:bg-secondary hover:text-white transition-all">
              <Download className="mr-2 h-4 w-4" /> Download PPT Report
            </Button>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-[140px] h-9 border-primary/20 font-bold tracking-wider">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lahore">Lahore</SelectItem>
                <SelectItem value="rawalpindi">Rawalpindi</SelectItem>
                <SelectItem value="gujranwala">Gujranwala</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px] h-9 border-primary/20 font-bold tracking-wider">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KPICard 
            title="Active Incidents" 
            value={stats.incidents}
            trend={12} 
            icon={AlertCircle} 
            className="border-b-4 border-b-destructive hover:shadow-lg transition-all"
          />
          <KPICard 
            title="Avg Response" 
            value={stats.responseTime}
            trend={-5} 
            trendLabel="improvement"
            icon={Clock}
            className="border-b-4 border-b-emerald-500 hover:shadow-lg transition-all"
          />
          <KPICard 
            title="Traffic Index" 
            value={stats.traffic}
            trend={2} 
            icon={Car}
            className="border-b-4 border-b-orange-500 hover:shadow-lg transition-all"
          />
          <KPICard 
            title="Construction" 
            value={stats.construction}
            trend={15} 
            icon={Construction}
            className="border-b-4 border-b-secondary hover:shadow-lg transition-all"
          />
          <KPICard 
            title="Uptime (CCTV)" 
            value="98.4%" 
            trend={0.2} 
            icon={Camera}
            className="border-b-4 border-b-blue-500 hover:shadow-lg transition-all"
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
                        <span className="font-medium">{unit.name}</span>
                        <span className="font-mono text-[10px]">{unit.active}/{unit.total}</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-secondary transition-all duration-1000" 
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