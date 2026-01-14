import { Layout } from "@/components/layout/Layout";
import { CityMap } from "@/components/dashboard/CityMap";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map as MapIcon, Layers, Camera, AlertTriangle, Truck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GISLayers() {
  return (
    <Layout title="Advanced GIS Layers">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-heading">Geospatial Intelligence</h2>
            <p className="text-sm text-muted-foreground">Manage and visualize spatial data layers for the entire metropolitan area.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">System Online</Badge>
            <Badge className="bg-primary/10 text-primary border-primary/20">4.5k Nodes</Badge>
          </div>
        </div>

        <Tabs defaultValue="map" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapIcon className="h-4 w-4" /> Operational Map
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Layers className="h-4 w-4" /> Layer Analytics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="map" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Layer Controls Panel */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Active Layers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { icon: Camera, label: "CCTV Network", count: "4,500", color: "text-blue-500", active: true },
                      { icon: AlertTriangle, label: "Incident Heatmap", count: "124", color: "text-orange-500", active: true },
                      { icon: Truck, label: "Patrol Units", count: "86", color: "text-emerald-500", active: true },
                      { icon: Layers, label: "Traffic Density", count: "High", color: "text-purple-500", active: false },
                    ].map((layer) => (
                      <div key={layer.label} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <layer.icon className={`h-4 w-4 ${layer.color}`} />
                          <div className="text-sm">
                            <p className="font-medium">{layer.label}</p>
                            <p className="text-[10px] text-muted-foreground">{layer.count} items</p>
                          </div>
                        </div>
                        <div className={`h-2 w-2 rounded-full ${layer.active ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Spatial Alerts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-xs font-bold text-destructive">High Density Alert</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Abnormal crowd gathering detected at Mall Road Intersection.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <p className="text-xs font-bold text-orange-600">Camera Offline</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Node 402 (Gulberg) reporting power failure.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Map View */}
              <div className="lg:col-span-3">
                <CityMap />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <Layers className="h-12 w-12 mb-4 opacity-20" />
                <p>Advanced geospatial analytics reporting engine.</p>
                <p className="text-xs">Processing city-wide spatial data...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}