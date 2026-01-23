import { Layout } from "@/components/layout/Layout";
import { CityMap } from "@/components/dashboard/CityMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  Construction,
  Search,
  Download,
  Filter,
  Info,
  Ruler,
  Zap
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

const GIS_STATS = [
  { label: "CCTV Uptime", value: "98.4%", change: "+0.2%", icon: Camera },
  { label: "Patrol Coverage", value: "92%", change: "+5%", icon: Truck },
  { label: "Construction Radius", value: "1.8km", change: "-0.1km", icon: Construction },
  { label: "Station Nodes", value: "24", change: "0", icon: Landmark },
];

export type LayerType = "cameras" | "incidents" | "patrols" | "construction" | "stations" | "traffic" | "hotspots";

export default function GISLayers() {
  const [selectedCity, setSelectedCity] = useState("lahore");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLayers, setActiveLayers] = useState<Set<LayerType>>(new Set([
    "cameras", "incidents", "patrols", "construction", "traffic"
  ]));
  const [showLegend, setShowLegend] = useState(true);
  const [mapRef, setMapRef] = useState<any>(null);

  const layerConfig = [
    { 
      id: "cameras" as LayerType, 
      icon: Camera, 
      label: "CCTV Network", 
      detail: "4,500 Cameras", 
      status: "Active", 
      color: "text-blue-500",
      layerName: "CCTV Coverage"
    },
    { 
      id: "construction" as LayerType, 
      icon: Construction, 
      label: "Construction Sites", 
      detail: "8 Active Projects", 
      status: "In Progress", 
      color: "text-orange-500",
      layerName: "Construction Projects"
    },
    { 
      id: "hotspots" as LayerType, 
      icon: AlertTriangle, 
      label: "Hotspot Zones", 
      detail: "12 Critical", 
      status: "Warning", 
      color: "text-secondary",
      layerName: "Incident Hotspots"
    },
    { 
      id: "patrols" as LayerType, 
      icon: Truck, 
      label: "Patrol Fleet", 
      detail: "86 Units", 
      status: "Tracking", 
      color: "text-emerald-500",
      layerName: "Patrol Units"
    },
    { 
      id: "stations" as LayerType, 
      icon: Landmark, 
      label: "Police Stations", 
      detail: "24 Locations", 
      status: "Static", 
      color: "text-primary",
      layerName: "Police Stations"
    },
    { 
      id: "traffic" as LayerType, 
      icon: Activity, 
      label: "Traffic Sensors", 
      detail: "1,200 Nodes", 
      status: "Live", 
      color: "text-purple-500",
      layerName: "Traffic Density"
    },
  ];

  const toggleLayer = (layerId: LayerType) => {
    setActiveLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  };

  const filteredLayers = useMemo(() => {
    if (!searchQuery) return layerConfig;
    const query = searchQuery.toLowerCase();
    return layerConfig.filter(layer => 
      layer.label.toLowerCase().includes(query) || 
      layer.detail.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleExportMap = () => {
    // Export functionality - can be enhanced with html2canvas
    alert("Map export functionality - Coming soon!");
  };

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
            
            <div className="flex gap-2 items-center">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lahore">Lahore</SelectItem>
                  <SelectItem value="rawalpindi">Rawalpindi</SelectItem>
                  <SelectItem value="gujranwala">Gujranwala</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportMap}
                className="h-8 text-xs"
              >
                <Download className="h-3 w-3 mr-1" /> Export
              </Button>
              <Badge variant="secondary" className="px-3 py-1 font-mono text-[10px]">
                {selectedCity.toUpperCase()}_GRID_ACTIVE
              </Badge>
              <Badge className="bg-emerald-500 hover:bg-emerald-600 px-3 py-1 font-mono text-[10px]">SYNCED</Badge>
            </div>
          </div>
          
          <TabsContent value="map" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* GIS Explorer Sidebar */}
              <div className="lg:col-span-3 space-y-4">
                <Card className="border-primary/10">
                  <CardHeader className="p-4 border-b space-y-3">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <Layers className="h-3 w-3" /> Spatial Inventory
                    </CardTitle>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search layers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 text-xs"
                      />
                    </div>
                  </CardHeader>
                  <ScrollArea className="h-[320px] sm:h-[420px] lg:h-[500px]">
                    <CardContent className="p-2 space-y-1">
                      {filteredLayers.map((item) => {
                        const isActive = activeLayers.has(item.id);
                        return (
                          <div 
                            key={item.id} 
                            onClick={() => toggleLayer(item.id)}
                            className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer group ${
                              isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`p-2 rounded-md transition-colors shadow-sm ${
                                isActive ? 'bg-primary/20' : 'bg-muted group-hover:bg-white'
                              }`}>
                              <item.icon className={`h-4 w-4 ${item.color}`} />
                            </div>
                              <div className="flex-1">
                              <p className="text-sm font-bold tracking-tight">{item.label}</p>
                              <p className="text-[10px] text-muted-foreground uppercase font-medium">{item.detail}</p>
                              </div>
                            </div>
                            <Switch 
                              checked={isActive} 
                              onCheckedChange={() => toggleLayer(item.id)}
                              className="ml-2"
                            />
                          </div>
                        );
                      })}
                    </CardContent>
                  </ScrollArea>
                </Card>

                {/* Map Legend */}
                {showLegend && (
                  <Card className="border-primary/10">
                    <CardHeader className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                          <Info className="h-3 w-3" /> Map Legend
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowLegend(false)}
                          className="h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 text-xs">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                          <span>Online Camera</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
                          <span>Offline Camera</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-destructive border-2 border-white animate-pulse"></div>
                          <span>High Severity Incident</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-orange-600 border-2 border-white"></div>
                          <span>Medium Severity</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse"></div>
                          <span>Active Patrol Unit</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-lg bg-orange-500 border-2 border-white"></div>
                          <span>Construction Site</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-lg bg-primary border-2 border-white"></div>
                          <span>Police Station</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-6 bg-red-500"></div>
                          <span>High Traffic</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-6 bg-emerald-500"></div>
                          <span>Low Traffic</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Advanced Map Engine */}
              <div className="lg:col-span-9">
                <CityMap 
                  city={selectedCity} 
                  activeLayers={activeLayers}
                  searchQuery={searchQuery}
                  onMapReady={setMapRef}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <DataExplorerTab activeLayers={activeLayers} selectedCity={selectedCity} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// Data Explorer Tab Component
function DataExplorerTab({ activeLayers, selectedCity }: { activeLayers: Set<LayerType>, selectedCity: string }) {
  // This would fetch real data from API in production
  const mockData = {
    cameras: [
      { id: 1, name: "Mall Road Sector 1", lat: 31.5204, lng: 74.3587, status: "Online", type: "PTZ", alerts: 2 },
      { id: 2, name: "Gulberg Main Blvd", lat: 31.5497, lng: 74.3436, status: "Offline", type: "Fixed", alerts: 0 },
    ],
    incidents: [
      { id: 1, type: "Traffic Accident", lat: 31.5100, lng: 74.3300, severity: "High", time: "10:15 AM", status: "Responding" },
      { id: 101, type: "Suspicious Activity", lat: 33.5750, lng: 73.0200, severity: "Medium", time: "11:20 AM", status: "Pending" },
    ],
    patrols: [
      { id: 1, label: "Dolphin Unit 102", lat: 31.5300, lng: 74.3400, status: "Active", type: "Motorcycle" },
      { id: 101, label: "PRU Unit 88", lat: 33.5550, lng: 73.0100, status: "Active", type: "Car" },
    ],
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Layer Data Explorer</h3>
          <p className="text-sm text-muted-foreground">Raw geospatial data attributes for urban planning and risk analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activeLayers.has("cameras") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Camera className="h-4 w-4" /> CCTV Cameras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {mockData.cameras.map((cam) => (
                    <div key={cam.id} className="p-3 border rounded-lg text-xs">
                      <p className="font-bold">{cam.name}</p>
                      <p className="text-muted-foreground">Lat: {cam.lat}, Lng: {cam.lng}</p>
                      <p>Status: <span className={cam.status === 'Online' ? 'text-emerald-500' : 'text-red-500'}>{cam.status}</span></p>
                      <p>Type: {cam.type} | Alerts: {cam.alerts}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {activeLayers.has("incidents") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Live Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {mockData.incidents.map((inc) => (
                    <div key={inc.id} className="p-3 border rounded-lg text-xs">
                      <p className="font-bold">{inc.type}</p>
                      <p className="text-muted-foreground">Lat: {inc.lat}, Lng: {inc.lng}</p>
                      <p>Severity: <span className={inc.severity === 'High' ? 'text-red-500' : 'text-orange-500'}>{inc.severity}</span></p>
                      <p>Time: {inc.time} | Status: {inc.status}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {activeLayers.has("patrols") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck className="h-4 w-4" /> Patrol Units
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {mockData.patrols.map((unit) => (
                    <div key={unit.id} className="p-3 border rounded-lg text-xs">
                      <p className="font-bold">{unit.label}</p>
                      <p className="text-muted-foreground">Lat: {unit.lat}, Lng: {unit.lng}</p>
                      <p>Status: <span className="text-emerald-500">{unit.status}</span></p>
                      <p>Type: {unit.type}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {activeLayers.size === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-4 opacity-10" />
            <h3 className="text-lg font-bold font-heading">No Active Layers</h3>
            <p className="text-sm">Enable layers from the Operations View to see data here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}