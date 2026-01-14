import { Layout } from "@/components/layout/Layout";
import { CityMap } from "@/components/dashboard/CityMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Map as MapIcon, 
  Layers, 
  Camera, 
  AlertTriangle, 
  Truck, 
  Shield, 
  Activity, 
  Landmark,
  TrendingUp,
  MapPin,
  Construction
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

const GIS_STATS = [
  { label: "CCTV Uptime", value: "98.4%", change: "+0.2%", icon: Camera },
  { label: "Patrol Coverage", value: "92%", change: "+5%", icon: Truck },
  { label: "Construction Radius", value: "1.8km", change: "-0.1km", icon: Construction },
  { label: "Station Nodes", value: "24", change: "0", icon: Landmark },
];

export default function GISLayers() {
  return (
    <Layout title="Advanced GIS Intelligence">
      <div className="flex flex-col gap-6">
        {/* Statistics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {GIS_STATS.map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm bg-primary text-white overflow-hidden relative group">
              <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:scale-110 transition-transform">
                <stat.icon className="h-20 w-20" />
              </div>
              <CardContent className="p-4 flex flex-col gap-1 relative z-10">
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">{stat.label}</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold font-heading">{stat.value}</span>
                  <span className="text-[10px] mb-1 text-emerald-400 font-bold">{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="map" className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <TabsList className="bg-muted p-1">
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapIcon className="h-4 w-4" /> Operations View
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Layers className="h-4 w-4" /> Data Explorer
              </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <Badge variant="secondary" className="px-3 py-1 font-mono text-[10px]">LHR_GRID_ACTIVE</Badge>
              <Badge className="bg-emerald-500 hover:bg-emerald-600 px-3 py-1 font-mono text-[10px]">SYNCED</Badge>
            </div>
          </div>
          
          <TabsContent value="map" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* GIS Explorer Sidebar */}
              <div className="lg:col-span-3 space-y-4">
                <Card className="border-primary/10">
                  <CardHeader className="p-4 border-b">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <Layers className="h-3 w-3" /> Spatial Inventory
                    </CardTitle>
                  </CardHeader>
                  <ScrollArea className="h-[500px]">
                    <CardContent className="p-2 space-y-1">
                      {[
                        { icon: Camera, label: "CCTV Network", detail: "4,500 Cameras", status: "Active", color: "text-blue-500" },
                        { icon: Construction, label: "Construction Sites", detail: "8 Active Projects", status: "In Progress", color: "text-orange-500" },
                        { icon: AlertTriangle, label: "Hotspot Zones", detail: "12 Critical", status: "Warning", color: "text-secondary" },
                        { icon: Truck, label: "Patrol Fleet", detail: "86 Units", status: "Tracking", color: "text-emerald-500" },
                        { icon: Landmark, label: "Police Stations", detail: "24 Locations", status: "Static", color: "text-primary" },
                        { icon: Activity, label: "Traffic Sensors", detail: "1,200 Nodes", status: "Live", color: "text-purple-500" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-all cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-muted group-hover:bg-white transition-colors shadow-sm">
                              <item.icon className={`h-4 w-4 ${item.color}`} />
                            </div>
                            <div>
                              <p className="text-sm font-bold tracking-tight">{item.label}</p>
                              <p className="text-[10px] text-muted-foreground uppercase font-medium">{item.detail}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </ScrollArea>
                </Card>
              </div>

              {/* Advanced Map Engine */}
              <div className="lg:col-span-9">
                <CityMap />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data">
             <Card className="border-dashed border-2">
               <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mb-4 opacity-10" />
                  <h3 className="text-lg font-bold font-heading">Layer Data Explorer</h3>
                  <p className="text-sm">Raw geospatial data attributes for urban planning and risk analysis.</p>
                  <button className="mt-4 px-6 py-2 bg-primary text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors">Connect Data Source</button>
               </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}