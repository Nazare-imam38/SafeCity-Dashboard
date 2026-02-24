import { Layout } from "@/components/layout/Layout";
import { CityMap } from "@/components/dashboard/CityMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Filter,
  Info,
  Ruler,
  Zap
} from "lucide-react";
import {
  getAllDivisions,
  getDistrictsByDivision,
  getTehsilsByDivisionAndDistrict,
} from "@/data/punjabHierarchy";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

export type LayerType = "cameras" | "incidents" | "patrols" | "construction" | "stations" | "traffic" | "hotspots";

export default function GISLayers() {
  const [selectedCity, setSelectedCity] = useState("lahore");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedTehsil, setSelectedTehsil] = useState<string>("all");
  const [activeLayers, setActiveLayers] = useState<Set<LayerType>>(new Set([
    "cameras", "incidents", "patrols", "construction", "traffic"
  ] as LayerType[]));
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

  // Get available divisions
  const divisions = useMemo(() => ["all", ...getAllDivisions()], []);

  // Get available districts based on selected division
  const districts = useMemo(() => {
    if (selectedDivision === "all") return ["all"];
    return ["all", ...getDistrictsByDivision(selectedDivision)];
  }, [selectedDivision]);

  // Get available tehsils based on selected division and district
  const tehsils = useMemo(() => {
    if (selectedDivision === "all" || selectedDistrict === "all") return ["all"];
    return ["all", ...getTehsilsByDivisionAndDistrict(selectedDivision, selectedDistrict)];
  }, [selectedDivision, selectedDistrict]);

  // Reset dependent filters when parent filter changes
  const handleDivisionChange = (value: string) => {
    setSelectedDivision(value);
    setSelectedDistrict("all");
    setSelectedTehsil("all");
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    setSelectedTehsil("all");
  };

  return (
    <Layout title="Advanced GIS Intelligence">
      <div className="flex flex-col gap-6">
        {/* Filter Bar Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* Filters Label */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Filter className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Filters:</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1">
              {/* Division Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 sm:flex-shrink-0">
                <label className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">Division:</label>
                <Select value={selectedDivision} onValueChange={handleDivisionChange}>
                  <SelectTrigger className="w-full sm:w-[160px] h-9 border-border/50 bg-background rounded-md">
                    <SelectValue placeholder="All Divisions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Divisions</SelectItem>
                    {getAllDivisions().map(div => (
                      <SelectItem key={div} value={div}>{div}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* District Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 sm:flex-shrink-0">
                <label className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">District:</label>
                <Select
                  value={selectedDistrict}
                  onValueChange={handleDistrictChange}
                  disabled={selectedDivision === "all"}
                >
                  <SelectTrigger
                    className={`w-full sm:w-[160px] h-9 border-border/50 bg-background rounded-md ${selectedDivision === "all" ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    disabled={selectedDivision === "all"}
                  >
                    <SelectValue placeholder="All Districts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Districts</SelectItem>
                    {selectedDivision !== "all" && getDistrictsByDivision(selectedDivision).map(dist => (
                      <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tehsil Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 sm:flex-shrink-0">
                <label className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">Tehsil:</label>
                <Select
                  value={selectedTehsil}
                  onValueChange={setSelectedTehsil}
                  disabled={selectedDivision === "all" || selectedDistrict === "all"}
                >
                  <SelectTrigger
                    className={`w-full sm:w-[160px] h-9 border-border/50 bg-background rounded-md ${selectedDivision === "all" || selectedDistrict === "all" ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    disabled={selectedDivision === "all" || selectedDistrict === "all"}
                  >
                    <SelectValue placeholder="All Tehsils" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tehsils</SelectItem>
                    {selectedDivision !== "all" && selectedDistrict !== "all" &&
                      getTehsilsByDivisionAndDistrict(selectedDivision, selectedDistrict).map(teh => (
                        <SelectItem key={teh} value={teh}>{teh}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              {(selectedDivision !== "all" || selectedDistrict !== "all" || selectedTehsil !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDivision("all");
                    setSelectedDistrict("all");
                    setSelectedTehsil("all");
                  }}
                  className="h-9 px-3 text-xs font-medium w-full sm:w-auto mt-2 sm:mt-0 color-white backgroundcolor-darkblue"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold font-heading text-primary">Operations Center</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* GIS Explorer Sidebar */}
              <div className="lg:col-span-4 space-y-6">
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
                  <ScrollArea className="h-[320px] sm:h-[420px] lg:h-[600px]">
                    <CardContent className="p-4 space-y-3">
                      {filteredLayers.map((item) => {
                        const isActive = activeLayers.has(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleLayer(item.id)}
                            className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 cursor-pointer group shadow-sm border border-transparent active:scale-[0.98] select-none ${isActive ? 'bg-primary/10 border-primary/20' : 'bg-muted/30 hover:bg-muted hover:border-muted-foreground/10'
                              }`}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`p-2.5 rounded-lg transition-colors shadow-sm ${isActive ? 'bg-primary/20 text-primary' : 'bg-white group-hover:bg-muted text-muted-foreground'
                                }`}>
                                <item.icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold tracking-tight mb-0.5">{item.label}</p>
                                <p className="text-[11px] text-muted-foreground uppercase font-semibold">{item.detail}</p>
                              </div>
                            </div>
                            <Switch
                              checked={isActive}
                              className="ml-2 pointer-events-none"
                            />
                          </div>
                        );
                      })}
                    </CardContent>
                  </ScrollArea>
                </Card>


              </div>

              {/* Advanced Map Engine */}
              <div className="lg:col-span-8">
                <CityMap
                  city={selectedCity}
                  activeLayers={activeLayers}
                  searchQuery={searchQuery}
                  onMapReady={setMapRef}
                  showLegend={showLegend}
                  onLegendClose={() => setShowLegend(false)}
                  showStats={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


