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

const PSCA_LOGO_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAOoAAADXCAMAAAAjrj0PAAABhlBMVEX///8nHHDuLiTpKSwAAAAvPB0AAGDuLCEFBwjtDwDnAADuMSf84eAjFm7sAADv7vP0Lx9CO3w9N3oXG3KUJVV6enrtGwr6MBoAAGP3tLFPH2kcLQAhFG4AAF4QJQCjo6PoGh4dLgApNxQWKQAUAGnpISQAGnYdDmz09PToCxEAHgDV1dUJIQAbC2wdHR2zs7PAwMC4u7Tn6OaHh4dSUlLKyspYYU1+hHf+8/MwKHNlZWUxMTHNzc2kqJ9yeWoAGQD61tbOzdq2tchzcJk3QyaTk5OQjqxZVIlKRICFgqWopr1ycnJnY5LY1+K+vc5GRkaMkoZiYmLwg4PrTk70qanxjo71qqvuZ2n3wsKIhadPWUMpKSlVXkr4zc3ucnLxYFrZLDN1Il/HKj6LJFkAEQCZnpT"; // Cleaned base64 string

export default function Dashboard() {
  const [selectedCity, setSelectedCity] = useState("lahore");
  const stats = CITY_STATS[selectedCity] || CITY_STATS.lahore;

  const handleDownloadPPT = () => {
    const pres = new pptxgen();
    
    // Master Slide / Theme
    pres.defineSlideMaster({
      title: "PSCA_MASTER",
      background: { color: "FFFFFF" },
      objects: [
        { rect: { x: 0, y: 0, w: "100%", h: 0.8, fill: { color: "1A365D" } } },
        { text: { text: "PSCA SAFE CITY MONITORING SYSTEM", options: { x: 0.5, y: 0.2, w: 8, h: 0.4, color: "FFFFFF", fontSize: 18, bold: true, fontFace: "Rajdhani" } } },
        { image: { x: 8.8, y: 0.1, w: 0.6, h: 0.6, data: PSCA_LOGO_BASE64 } },
        { rect: { x: 0, y: 5.4, w: "100%", h: 0.2, fill: { color: "E53E3E" } } },
        { text: { text: "PSCA SAFE CITY PORTAL - CONFIDENTIAL", options: { x: 0.5, y: 5.4, w: 9, h: 0.2, color: "FFFFFF", fontSize: 8, align: "right" } } }
      ]
    });

    // SLIDE 1: Executive Summary
    const s1 = pres.addSlide({ masterName: "PSCA_MASTER" });
    s1.addText(`${selectedCity.toUpperCase()} City Operational Report`, { x: 0.5, y: 1.2, w: 9, h: 0.5, fontSize: 24, bold: true, color: "1A365D" });
    
    // INFOGRAPHIC CARDS WITH SYMBOLS (using wingdings/builtin shapes as placeholders for icons)
    const metrics = [
      { label: "Active Incidents", value: stats.incidents, color: "E53E3E", icon: "!" },
      { label: "Response Time", value: stats.responseTime, color: "2B6CB0", icon: "t" },
      { label: "Construction", value: stats.construction, color: "DD6B20", icon: "c" },
      { label: "Cameras Online", value: stats.cameras, color: "38A169", icon: "v" }
    ];

    metrics.forEach((m, i) => {
      const xPos = 0.5 + (i * 2.3);
      s1.addShape(pres.ShapeType.roundRect, { x: xPos, y: 2.0, w: 2.1, h: 1.6, fill: { color: "F7FAFC" }, line: { color: m.color, width: 2 } });
      s1.addText(m.icon, { x: xPos, y: 2.1, w: 2.1, h: 0.4, fontSize: 24, bold: true, color: m.color, align: "center", fontFace: "Wingdings" });
      s1.addText(m.label, { x: xPos, y: 2.6, w: 2.1, h: 0.3, fontSize: 10, bold: true, color: "4A5568", align: "center" });
      s1.addText(m.value, { x: xPos, y: 2.9, w: 2.1, h: 0.4, fontSize: 18, bold: true, color: m.color, align: "center" });
    });

    // SLIDE 2: Project Progress
    const s2 = pres.addSlide({ masterName: "PSCA_MASTER" });
    s2.addText("Infrastructure Development Progress", { x: 0.5, y: 1.0, w: 9, h: 0.4, fontSize: 20, bold: true, color: "1A365D" });
    
    const chartData = [
      { name: "Surveys", labels: ["Progress"], values: [100] },
      { name: "Foundation", labels: ["Progress"], values: [85] },
      { name: "Cabinet", labels: ["Progress"], values: [95] },
      { name: "Cabling", labels: ["Progress"], values: [70] },
      { name: "Control Room", labels: ["Progress"], values: [40] }
    ];

    s2.addChart(pres.ChartType.bar, [
      { name: "Phase Progress", labels: chartData.map(d => d.name), values: chartData.map(d => d.values[0]) }
    ], { 
      x: 0.5, y: 1.6, w: 4.5, h: 3.5,
      showValue: true,
      barGapWidthPct: 30,
      chartColors: ["1A365D"],
      valAxisMaxVal: 100,
      showLegend: false
    });

    // Added a second chart for better visualization
    s2.addChart(pres.ChartType.line, [
      { name: "Incidents Trend", labels: ["Mon", "Tue", "Wed", "Thu", "Fri"], values: [120, 150, 110, 180, 140] }
    ], { 
      x: 5.2, y: 1.6, w: 4.2, h: 3.5,
      showLegend: true,
      chartColors: ["E53E3E"],
      title: "Weekly Incident Volatility"
    });

    // SLIDE 3: Resource Distribution (New visualization)
    const s3 = pres.addSlide({ masterName: "PSCA_MASTER" });
    s3.addText("Resource Allocation Analysis", { x: 0.5, y: 1.0, w: 9, h: 0.4, fontSize: 20, bold: true, color: "1A365D" });
    s3.addChart(pres.ChartType.pie, [
      { name: "Personnel", labels: ["Dolphin", "Traffic", "PRU", "Admin"], values: [40, 30, 20, 10] }
    ], {
      x: 2.5, y: 1.6, w: 5, h: 3.5,
      showLegend: true,
      legendPos: "r",
      showValue: true,
      chartColors: ["1A365D", "2B6CB0", "4A5568", "E53E3E"]
    });

    pres.writeFile({ fileName: `PSCA_${selectedCity}_Operational_Brief.pptx` });
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
            <Button variant="outline" size="sm" onClick={handleDownloadPPT} className="bg-secondary/10 text-secondary border-secondary/20 font-bold hover:bg-secondary hover:text-white transition-all shadow-sm">
              <Download className="mr-2 h-4 w-4" /> Export Operations PPT
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
            <CityMap city={selectedCity} />
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