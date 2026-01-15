import { Layout } from "@/components/layout/Layout";
import { InstallationCard } from "@/components/dashboard/InstallationCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { InstallationMap } from "@/components/dashboard/InstallationMap";
import { PhaseBreakdownChart } from "@/components/dashboard/PhaseBreakdownChart";
import { PhaseDistributionChart } from "@/components/dashboard/PhaseDistributionChart";
import { PhaseTimelineChart } from "@/components/dashboard/PhaseTimelineChart";
import { exportDashboardToPPTX } from "@/utils/exportToPPTX";
import { 
  getAllDivisions,
  getDistrictsByDivision,
  getTehsilsByDivisionAndDistrict,
  CITY_TO_HIERARCHY_MAP
} from "@/data/punjabHierarchy";
import { 
  ClipboardCheck, 
  Building2, 
  Camera, 
  Zap, 
  Home, 
  Radio,
  Moon, 
  Sun,
  TrendingUp,
  FileDown,
  Filter
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useMemo } from "react";
import { useTheme } from "@/hooks/use-theme";

// Installation progress data for all Punjab cities
interface CityInstallationData {
  surveys: number;
  foundations: number;
  cabinet: number;
  cable: number;
  controlRoom: number;
  ppic3: number;
  overall: number;
  timeline?: {
    month: string;
    surveys: number;
    foundations: number;
    cabinet: number;
    cable: number;
    controlRoom: number;
    ppic3: number;
    overall: number;
  }[];
}

const CITY_INSTALLATION_DATA: Record<string, CityInstallationData> = {
  sheikhupura: {
    surveys: 100,
    foundations: 95,
    cabinet: 88,
    cable: 75,
    controlRoom: 60,
    ppic3: 45,
    overall: 77,
    timeline: [
      { month: "Jan", surveys: 50, foundations: 20, cabinet: 10, cable: 5, controlRoom: 0, ppic3: 0, overall: 14 },
      { month: "Feb", surveys: 75, foundations: 50, cabinet: 35, cable: 20, controlRoom: 10, ppic3: 5, overall: 33 },
      { month: "Mar", surveys: 90, foundations: 75, cabinet: 60, cable: 45, controlRoom: 30, ppic3: 15, overall: 53 },
      { month: "Apr", surveys: 100, foundations: 85, cabinet: 75, cable: 60, controlRoom: 45, ppic3: 30, overall: 66 },
      { month: "May", surveys: 100, foundations: 92, cabinet: 82, cable: 70, controlRoom: 55, ppic3: 40, overall: 73 },
      { month: "Jun", surveys: 100, foundations: 95, cabinet: 88, cable: 75, controlRoom: 60, ppic3: 45, overall: 77 },
    ]
  },
  sialkot: {
    surveys: 100,
    foundations: 92,
    cabinet: 85,
    cable: 70,
    controlRoom: 55,
    ppic3: 40,
    overall: 72,
    timeline: [
      { month: "Jan", surveys: 45, foundations: 15, cabinet: 8, cable: 3, controlRoom: 0, ppic3: 0, overall: 12 },
      { month: "Feb", surveys: 70, foundations: 45, cabinet: 30, cable: 18, controlRoom: 8, ppic3: 3, overall: 29 },
      { month: "Mar", surveys: 85, foundations: 70, cabinet: 55, cable: 40, controlRoom: 25, ppic3: 12, overall: 48 },
      { month: "Apr", surveys: 95, foundations: 82, cabinet: 70, cable: 55, controlRoom: 40, ppic3: 25, overall: 61 },
      { month: "May", surveys: 100, foundations: 88, cabinet: 78, cable: 65, controlRoom: 50, ppic3: 35, overall: 69 },
      { month: "Jun", surveys: 100, foundations: 92, cabinet: 85, cable: 70, controlRoom: 55, ppic3: 40, overall: 72 },
    ]
  },
  gujrat: {
    surveys: 100,
    foundations: 88,
    cabinet: 80,
    cable: 65,
    controlRoom: 50,
    ppic3: 35,
    overall: 68,
    timeline: [
      { month: "Jan", surveys: 40, foundations: 12, cabinet: 5, cable: 2, controlRoom: 0, ppic3: 0, overall: 10 },
      { month: "Feb", surveys: 65, foundations: 40, cabinet: 25, cable: 15, controlRoom: 5, ppic3: 2, overall: 26 },
      { month: "Mar", surveys: 80, foundations: 65, cabinet: 50, cable: 35, controlRoom: 20, ppic3: 10, overall: 43 },
      { month: "Apr", surveys: 90, foundations: 78, cabinet: 65, cable: 50, controlRoom: 35, ppic3: 20, overall: 56 },
      { month: "May", surveys: 100, foundations: 84, cabinet: 73, cable: 58, controlRoom: 45, ppic3: 28, overall: 65 },
      { month: "Jun", surveys: 100, foundations: 88, cabinet: 80, cable: 65, controlRoom: 50, ppic3: 35, overall: 68 },
    ]
  },
  jehlum: {
    surveys: 100,
    foundations: 85,
    cabinet: 75,
    cable: 60,
    controlRoom: 45,
    ppic3: 30,
    overall: 66,
    timeline: [
      { month: "Jan", surveys: 35, foundations: 10, cabinet: 3, cable: 1, controlRoom: 0, ppic3: 0, overall: 8 },
      { month: "Feb", surveys: 60, foundations: 35, cabinet: 20, cable: 12, controlRoom: 3, ppic3: 1, overall: 22 },
      { month: "Mar", surveys: 75, foundations: 60, cabinet: 45, cable: 30, controlRoom: 18, ppic3: 8, overall: 39 },
      { month: "Apr", surveys: 85, foundations: 72, cabinet: 60, cable: 45, controlRoom: 30, ppic3: 18, overall: 52 },
      { month: "May", surveys: 95, foundations: 80, cabinet: 68, cable: 55, controlRoom: 40, ppic3: 25, overall: 61 },
      { month: "Jun", surveys: 100, foundations: 85, cabinet: 75, cable: 60, controlRoom: 45, ppic3: 30, overall: 66 },
    ]
  },
  attock: {
    surveys: 100,
    foundations: 82,
    cabinet: 72,
    cable: 55,
    controlRoom: 40,
    ppic3: 25,
    overall: 62,
    timeline: [
      { month: "Jan", surveys: 30, foundations: 8, cabinet: 2, cable: 0, controlRoom: 0, ppic3: 0, overall: 7 },
      { month: "Feb", surveys: 55, foundations: 30, cabinet: 15, cable: 8, controlRoom: 2, ppic3: 0, overall: 18 },
      { month: "Mar", surveys: 70, foundations: 55, cabinet: 40, cable: 25, controlRoom: 15, ppic3: 5, overall: 35 },
      { month: "Apr", surveys: 80, foundations: 68, cabinet: 55, cable: 40, controlRoom: 28, ppic3: 15, overall: 48 },
      { month: "May", surveys: 90, foundations: 76, cabinet: 65, cable: 50, controlRoom: 35, ppic3: 20, overall: 56 },
      { month: "Jun", surveys: 100, foundations: 82, cabinet: 72, cable: 55, controlRoom: 40, ppic3: 25, overall: 62 },
    ]
  },
  hassanAbdal: {
    surveys: 100,
    foundations: 78,
    cabinet: 68,
    cable: 50,
    controlRoom: 35,
    ppic3: 20,
    overall: 59,
    timeline: [
      { month: "Jan", surveys: 25, foundations: 5, cabinet: 1, cable: 0, controlRoom: 0, ppic3: 0, overall: 5 },
      { month: "Feb", surveys: 50, foundations: 25, cabinet: 12, cable: 5, controlRoom: 1, ppic3: 0, overall: 15 },
      { month: "Mar", surveys: 65, foundations: 50, cabinet: 35, cable: 20, controlRoom: 12, ppic3: 3, overall: 29 },
      { month: "Apr", surveys: 75, foundations: 62, cabinet: 50, cable: 35, controlRoom: 25, ppic3: 10, overall: 43 },
      { month: "May", surveys: 85, foundations: 72, cabinet: 60, cable: 45, controlRoom: 30, ppic3: 15, overall: 51 },
      { month: "Jun", surveys: 100, foundations: 78, cabinet: 68, cable: 50, controlRoom: 35, ppic3: 20, overall: 59 },
    ]
  },
  sahiwal: {
    surveys: 100,
    foundations: 90,
    cabinet: 82,
    cable: 68,
    controlRoom: 52,
    ppic3: 38,
    overall: 72,
    timeline: [
      { month: "Jan", surveys: 48, foundations: 18, cabinet: 12, cable: 6, controlRoom: 2, ppic3: 0, overall: 16 },
      { month: "Feb", surveys: 72, foundations: 52, cabinet: 38, cable: 22, controlRoom: 12, ppic3: 5, overall: 33 },
      { month: "Mar", surveys: 88, foundations: 75, cabinet: 62, cable: 48, controlRoom: 32, ppic3: 18, overall: 55 },
      { month: "Apr", surveys: 95, foundations: 82, cabinet: 72, cable: 58, controlRoom: 42, ppic3: 28, overall: 63 },
      { month: "May", surveys: 100, foundations: 87, cabinet: 78, cable: 65, controlRoom: 48, ppic3: 34, overall: 69 },
      { month: "Jun", surveys: 100, foundations: 90, cabinet: 82, cable: 68, controlRoom: 52, ppic3: 38, overall: 72 },
    ]
  },
  okara: {
    surveys: 100,
    foundations: 87,
    cabinet: 78,
    cable: 62,
    controlRoom: 48,
    ppic3: 32,
    overall: 68,
    timeline: [
      { month: "Jan", surveys: 42, foundations: 15, cabinet: 8, cable: 4, controlRoom: 1, ppic3: 0, overall: 12 },
      { month: "Feb", surveys: 68, foundations: 48, cabinet: 32, cable: 18, controlRoom: 8, ppic3: 3, overall: 31 },
      { month: "Mar", surveys: 82, foundations: 68, cabinet: 55, cable: 42, controlRoom: 28, ppic3: 15, overall: 48 },
      { month: "Apr", surveys: 92, foundations: 78, cabinet: 68, cable: 55, controlRoom: 38, ppic3: 25, overall: 60 },
      { month: "May", surveys: 98, foundations: 84, cabinet: 74, cable: 60, controlRoom: 44, ppic3: 29, overall: 65 },
      { month: "Jun", surveys: 100, foundations: 87, cabinet: 78, cable: 62, controlRoom: 48, ppic3: 32, overall: 68 },
    ]
  },
  jhang: {
    surveys: 100,
    foundations: 83,
    cabinet: 70,
    cable: 58,
    controlRoom: 42,
    ppic3: 28,
    overall: 64,
    timeline: [
      { month: "Jan", surveys: 38, foundations: 12, cabinet: 6, cable: 3, controlRoom: 0, ppic3: 0, overall: 10 },
      { month: "Feb", surveys: 62, foundations: 42, cabinet: 28, cable: 15, controlRoom: 6, ppic3: 2, overall: 26 },
      { month: "Mar", surveys: 78, foundations: 62, cabinet: 48, cable: 35, controlRoom: 22, ppic3: 10, overall: 43 },
      { month: "Apr", surveys: 88, foundations: 72, cabinet: 60, cable: 48, controlRoom: 32, ppic3: 18, overall: 53 },
      { month: "May", surveys: 95, foundations: 78, cabinet: 65, cable: 55, controlRoom: 38, ppic3: 24, overall: 59 },
      { month: "Jun", surveys: 100, foundations: 83, cabinet: 70, cable: 58, controlRoom: 42, ppic3: 28, overall: 64 },
    ]
  },
  muzaffargarh: {
    surveys: 100,
    foundations: 80,
    cabinet: 65,
    cable: 52,
    controlRoom: 38,
    ppic3: 22,
    overall: 60,
    timeline: [
      { month: "Jan", surveys: 32, foundations: 8, cabinet: 3, cable: 1, controlRoom: 0, ppic3: 0, overall: 7 },
      { month: "Feb", surveys: 58, foundations: 38, cabinet: 22, cable: 12, controlRoom: 4, ppic3: 1, overall: 23 },
      { month: "Mar", surveys: 72, foundations: 58, cabinet: 42, cable: 28, controlRoom: 18, ppic3: 8, overall: 38 },
      { month: "Apr", surveys: 82, foundations: 68, cabinet: 55, cable: 42, controlRoom: 28, ppic3: 15, overall: 48 },
      { month: "May", surveys: 92, foundations: 75, cabinet: 60, cable: 48, controlRoom: 34, ppic3: 20, overall: 55 },
      { month: "Jun", surveys: 100, foundations: 80, cabinet: 65, cable: 52, controlRoom: 38, ppic3: 22, overall: 60 },
    ]
  },
};

const CITY_NAMES: Record<string, string> = {
  sheikhupura: "Sheikhupura",
  sialkot: "Sialkot",
  gujrat: "Gujrat",
  jehlum: "Jehlum",
  attock: "Attock",
  hassanAbdal: "Hassan Abdal",
  sahiwal: "Sahiwal",
  okara: "Okara",
  jhang: "Jhang",
  muzaffargarh: "Muzaffargarh",
};

export default function Dashboard() {
  const [selectedCity, setSelectedCity] = useState<keyof typeof CITY_INSTALLATION_DATA | "all">("sheikhupura");
  const [selectedDivision, setSelectedDivision] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedTehsil, setSelectedTehsil] = useState<string>("all");
  const { theme, toggleTheme } = useTheme();

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

  // Filter cities based on hierarchy selection
  const filteredCities = useMemo(() => {
    const allCityKeys = Object.keys(CITY_NAMES);
    
    if (selectedDivision === "all") return allCityKeys;
    
    let filtered = allCityKeys.filter(cityKey => {
      const cityName = CITY_NAMES[cityKey];
      const hierarchy = CITY_TO_HIERARCHY_MAP[cityName];
      if (!hierarchy) return false;
      
      if (hierarchy.division !== selectedDivision) return false;
      if (selectedDistrict !== "all" && hierarchy.district !== selectedDistrict) return false;
      if (selectedTehsil !== "all" && hierarchy.tehsil !== selectedTehsil) return false;
      
      return true;
    });
    
    return filtered;
  }, [selectedDivision, selectedDistrict, selectedTehsil]);

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
  
  // Calculate aggregated data for filtered cities
  const getFilteredCitiesData = (cityKeys: string[]): CityInstallationData => {
    const cities = cityKeys.map(key => CITY_INSTALLATION_DATA[key]).filter(Boolean);
    const count = cities.length;
    if (count === 0) {
      // Return default empty data structure
      return {
        surveys: 0,
        foundations: 0,
        cabinet: 0,
        cable: 0,
        controlRoom: 0,
        ppic3: 0,
        overall: 0,
        timeline: [],
      };
    }
    
    return {
      surveys: Math.round(cities.reduce((sum, city) => sum + city.surveys, 0) / count),
      foundations: Math.round(cities.reduce((sum, city) => sum + city.foundations, 0) / count),
      cabinet: Math.round(cities.reduce((sum, city) => sum + city.cabinet, 0) / count),
      cable: Math.round(cities.reduce((sum, city) => sum + city.cable, 0) / count),
      controlRoom: Math.round(cities.reduce((sum, city) => sum + city.controlRoom, 0) / count),
      ppic3: Math.round(cities.reduce((sum, city) => sum + city.ppic3, 0) / count),
      overall: Math.round(cities.reduce((sum, city) => sum + city.overall, 0) / count),
      timeline: cities[0]?.timeline?.map((_, monthIndex) => {
        const monthData = cities.map(city => city.timeline?.[monthIndex]).filter(Boolean);
        if (monthData.length === 0) return null;
        
        return {
          month: monthData[0]?.month || "",
          surveys: Math.round(monthData.reduce((sum, m) => sum + (m?.surveys || 0), 0) / monthData.length),
          foundations: Math.round(monthData.reduce((sum, m) => sum + (m?.foundations || 0), 0) / monthData.length),
          cabinet: Math.round(monthData.reduce((sum, m) => sum + (m?.cabinet || 0), 0) / monthData.length),
          cable: Math.round(monthData.reduce((sum, m) => sum + (m?.cable || 0), 0) / monthData.length),
          controlRoom: Math.round(monthData.reduce((sum, m) => sum + (m?.controlRoom || 0), 0) / monthData.length),
          ppic3: Math.round(monthData.reduce((sum, m) => sum + (m?.ppic3 || 0), 0) / monthData.length),
          overall: Math.round(monthData.reduce((sum, m) => sum + (m?.overall || 0), 0) / monthData.length),
        };
      }).filter(Boolean) as CityInstallationData['timeline'],
    };
  };

  // Determine which cities to show based on filters
  const citiesToShow = useMemo(() => {
    if (selectedCity === "all") {
      // If hierarchy filters are applied, use filtered cities, otherwise all cities
      if (selectedDivision !== "all" || selectedDistrict !== "all" || selectedTehsil !== "all") {
        return filteredCities;
      }
      return Object.keys(CITY_NAMES);
    }
    // If a specific city is selected, check if it matches the filters
    const cityName = CITY_NAMES[selectedCity];
    const hierarchy = CITY_TO_HIERARCHY_MAP[cityName];
    if (hierarchy) {
      if (selectedDivision !== "all" && hierarchy.division !== selectedDivision) return [];
      if (selectedDistrict !== "all" && hierarchy.district !== selectedDistrict) return [];
      if (selectedTehsil !== "all" && hierarchy.tehsil !== selectedTehsil) return [];
    }
    return [selectedCity];
  }, [selectedCity, selectedDivision, selectedDistrict, selectedTehsil, filteredCities]);

  // Check if we have valid data to display
  const hasValidData = citiesToShow.length > 0;
  
  const cityData = hasValidData
    ? (selectedCity === "all" || citiesToShow.length > 1
        ? getFilteredCitiesData(citiesToShow)
        : CITY_INSTALLATION_DATA[selectedCity])
    : {
        surveys: 0,
        foundations: 0,
        cabinet: 0,
        cable: 0,
        controlRoom: 0,
        ppic3: 0,
        overall: 0,
        timeline: [],
      };
  
  const cityName = hasValidData
    ? (selectedCity === "all" 
        ? (citiesToShow.length === Object.keys(CITY_NAMES).length 
            ? "All Cities" 
            : `Filtered Cities (${citiesToShow.length})`)
        : CITY_NAMES[selectedCity] || selectedCity)
    : "No Data Available";

  const installationPhases = [
    {
      key: "surveys" as const,
      title: "Surveys",
      icon: ClipboardCheck,
      color: "blue" as const,
    },
    {
      key: "foundations" as const,
      title: "Foundations Pole Installations",
      icon: Building2,
      color: "green" as const,
    },
    {
      key: "cabinet" as const,
      title: "Cabinet Cameras Installation",
      icon: Camera,
      color: "orange" as const,
    },
    {
      key: "cable" as const,
      title: "Cable Laying & Power Connections",
      icon: Zap,
      color: "purple" as const,
    },
    {
      key: "controlRoom" as const,
      title: "Control Room Renovations",
      icon: Home,
      color: "red" as const,
    },
    {
      key: "ppic3" as const,
      title: "PPIC3 Go Live",
      icon: Radio,
      color: "yellow" as const,
    },
  ];

  return (
    <Layout title="Camera Installation Progress Dashboard">
      <div className="flex flex-col gap-8">
        {/* Filter Bar */}
        <Card className="border-border/50 shadow-sm bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Filters Label */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Filters:</span>
              </div>

              {/* Division Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground whitespace-nowrap">Division:</label>
                <Select value={selectedDivision} onValueChange={handleDivisionChange}>
                  <SelectTrigger className="w-[160px] h-9 border-border/50">
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
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground whitespace-nowrap">District:</label>
                <Select 
                  value={selectedDistrict} 
                  onValueChange={handleDistrictChange}
                  disabled={selectedDivision === "all"}
                >
                  <SelectTrigger className="w-[160px] h-9 border-border/50" disabled={selectedDivision === "all"}>
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
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground whitespace-nowrap">Tehsil:</label>
                <Select 
                  value={selectedTehsil} 
                  onValueChange={setSelectedTehsil}
                  disabled={selectedDivision === "all" || selectedDistrict === "all"}
                >
                  <SelectTrigger className="w-[160px] h-9 border-border/50" disabled={selectedDivision === "all" || selectedDistrict === "all"}>
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
                  className="ml-auto h-9"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Header Section - Enhanced Design */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 shadow-lg">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold font-heading bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {cityName}
                  </h1>
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    Camera Installation Progress Dashboard
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="px-4 py-1.5 text-sm font-semibold bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                  Overall: {cityData.overall}%
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">
                  Punjab Safe City Authority
                </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
                className="rounded-xl w-11 h-11 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm"
              onClick={() => toggleTheme()}
            >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="outline"
              className="rounded-xl h-11 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm font-semibold"
              onClick={async () => {
                if (selectedCity === "all") {
                  alert('Please select a specific city to export the presentation.');
                  return;
                }
                try {
                  await exportDashboardToPPTX({
                    cityName,
                    cityData,
                    installationPhases: installationPhases.map(phase => ({
                      key: phase.key,
                      title: phase.title,
                      percentage: cityData[phase.key],
                    })),
                  });
                } catch (error) {
                  console.error('Error exporting to PPTX:', error);
                  alert('Error exporting presentation. Please try again.');
                }
              }}
              disabled={selectedCity === "all"}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export Operation pptx
            </Button>
              <Select 
                value={selectedCity} 
                onValueChange={(value) => setSelectedCity(value as keyof typeof CITY_INSTALLATION_DATA | "all")}
              >
                <SelectTrigger className="w-[200px] h-11 border-border/50 hover:border-primary/50 font-semibold rounded-xl shadow-sm">
                  <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {Object.entries(CITY_NAMES)
                    .filter(([key]) => {
                      // Filter cities based on hierarchy filters
                      if (selectedDivision === "all" && selectedDistrict === "all" && selectedTehsil === "all") {
                        return true;
                      }
                      const cityName = CITY_NAMES[key];
                      const hierarchy = CITY_TO_HIERARCHY_MAP[cityName];
                      if (!hierarchy) return false;
                      if (selectedDivision !== "all" && hierarchy.division !== selectedDivision) return false;
                      if (selectedDistrict !== "all" && hierarchy.district !== selectedDistrict) return false;
                      if (selectedTehsil !== "all" && hierarchy.tehsil !== selectedTehsil) return false;
                      return true;
                    })
                    .map(([key, name]) => (
                      <SelectItem key={key} value={key}>{name}</SelectItem>
                    ))}
              </SelectContent>
            </Select>
            </div>
          </div>
        </div>

        {/* Installation Phase Cards - Single Row with Better Spacing */}
        {hasValidData ? (
          <div className="w-full">
            <div className="mb-4">
              <h2 className="text-xl font-bold font-heading mb-1">Installation Phases</h2>
              <p className="text-sm text-muted-foreground">Progress breakdown by installation phase</p>
            </div>
            <div className="grid grid-cols-6 gap-3" key={`cards-${selectedCity}`}>
              {installationPhases.map((phase) => (
                <InstallationCard
                  key={`${selectedCity}-${phase.key}`}
                  title={phase.title}
                  percentage={cityData[phase.key]}
                  icon={phase.icon}
                  color={phase.color}
                />
              ))}
            </div>
          </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No data available for the selected filters. Please adjust your filter criteria.</p>
            </CardContent>
          </Card>
        )}

        {/* Overall Progress Card - Enhanced Design */}
        {hasValidData && (
          <Card className="relative overflow-hidden border-2 border-primary/20 shadow-xl bg-gradient-to-br from-card to-card/95">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <CardContent className="relative p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                      <TrendingUp className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold font-heading">Overall Installation Progress</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Combined progress across all installation phases
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <div className="inline-block">
                    <div className="text-6xl font-bold font-heading bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent tabular-nums">
                      {cityData.overall}
                      <span className="text-3xl">%</span>
                    </div>
                    <div className="mt-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 inline-block">
                      <span className="text-sm font-semibold text-primary">
                        {cityData.overall === 100 ? "Fully Completed" : 
                         cityData.overall >= 80 ? "Near Completion" : 
                         cityData.overall >= 50 ? "In Progress" : "Early Stage"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <div className="relative h-5 w-full overflow-hidden rounded-full bg-muted/60 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary transition-all duration-1000 ease-out rounded-full shadow-lg relative overflow-hidden"
                    style={{ width: `${cityData.overall}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>0%</span>
                  <span className="font-medium">Target: 100%</span>
                  <span>100%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map Section */}
        {hasValidData && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold font-heading mb-1">Geographic Overview</h2>
              <p className="text-sm text-muted-foreground">Interactive map showing installation progress across Punjab cities</p>
            </div>
            <InstallationMap 
              cityData={Object.fromEntries(
                Object.entries(CITY_INSTALLATION_DATA).map(([key, data]) => [
                  key,
                  { overall: data.overall }
                ])
              )}
              selectedCity={selectedCity === "all" ? undefined : selectedCity}
              onCitySelect={(city) => setSelectedCity(city as keyof typeof CITY_INSTALLATION_DATA)}
          />
        </div>
        )}

        {/* Charts Grid - Enhanced Layout */}
        {hasValidData ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold font-heading mb-1">Analytics & Insights</h2>
            <p className="text-sm text-muted-foreground">Detailed progress analysis and city comparisons</p>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Progress Timeline Chart */}
            <div className="lg:col-span-7" key={`timeline-${selectedCity}`}>
              <TrendChart cityData={cityData.timeline} cityKey={selectedCity} />
            </div>

            {/* Phase Breakdown Chart */}
            <div className="lg:col-span-5" key={`phase-breakdown-${selectedCity}`}>
              <PhaseBreakdownChart 
                data={installationPhases.map(phase => ({
                  phase: phase.title,
                  percentage: cityData[phase.key],
                }))}
              />
            </div>
                      </div>

          {/* Modern Charts Section */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Phase Distribution Pie Chart */}
            <div className="lg:col-span-12" key={`phase-distribution-${selectedCity}`}>
              <PhaseDistributionChart 
                data={installationPhases.map(phase => ({
                  phase: phase.title,
                  percentage: cityData[phase.key],
                }))}
                        />
                      </div>
                   </div>

          {/* Phase Timeline Chart */}
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-12" key={`phase-timeline-${selectedCity}`}>
              <PhaseTimelineChart 
                timelineData={cityData.timeline}
                cityKey={selectedCity}
              />
            </div>
          </div>
        </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No chart data available for the selected filters.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
