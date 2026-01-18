import { Layout } from "@/components/layout/Layout";
import { InstallationCard } from "@/components/dashboard/InstallationCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { InstallationMap } from "@/components/dashboard/InstallationMap";
import { PhaseBreakdownChart } from "@/components/dashboard/PhaseBreakdownChart";
import { PhaseDistributionChart } from "@/components/dashboard/PhaseDistributionChart";
import { PhaseTimelineChart } from "@/components/dashboard/PhaseTimelineChart";
import { PlannedVsActualChart } from "@/components/dashboard/PlannedVsActualChart";
import { HierarchyCard } from "@/components/dashboard/HierarchyCard";
import { SubProject } from "@/components/dashboard/SubProjectCard";
import { exportDashboardToPPTX } from "@/utils/exportToPPTX";
import { 
  getAllDivisions,
  getDistrictsByDivision,
  getTehsilsByDivisionAndDistrict,
  CITY_TO_HIERARCHY_MAP,
  PUNJAB_HIERARCHY
} from "@/data/punjabHierarchy";
import { 
  getAllDivisionData,
  getAllDistrictData,
  getAllTehsilData,
  KNOWN_CITY_DATA,
  generateMockData,
  InstallationData
} from "@/data/punjabInstallationData";
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
  Filter,
  ArrowLeft
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { useTheme } from "@/hooks/use-theme";
import { CheckCircle2 } from "lucide-react";

// Enhanced installation progress data with sub-projects and planned vs actual
interface PhaseProgress {
  actual: number;
  planned: number;
  subProjects?: SubProject[];
  timeline?: {
    month: string;
    actual: number;
    planned: number;
  }[];
}

interface CityInstallationData {
  surveys: number | PhaseProgress;
  foundations: number | PhaseProgress;
  cabinet: number | PhaseProgress;
  cable: number | PhaseProgress;
  controlRoom: number | PhaseProgress;
  ppic3: number | PhaseProgress;
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

// Helper function to get progress value (backward compatible)
const getProgressValue = (progress: number | PhaseProgress): number => {
  return typeof progress === 'number' ? progress : progress.actual;
};

// Helper function to check if progress has detailed data
const hasDetailedProgress = (progress: number | PhaseProgress): progress is PhaseProgress => {
  return typeof progress !== 'number';
};

// Generate sub-projects for a phase (sample data structure)
const generateSubProjects = (
  phaseKey: string,
  actualProgress: number,
  plannedProgress: number
): SubProject[] => {
  // Sample sub-project structure - this should be replaced with real data
  const subProjectTemplates: Record<string, { names: string[], weights: number[] }> = {
    surveys: {
      names: ["Site Survey & Assessment", "Technical Feasibility Study", "Site Selection & Approval", "Environmental Clearance"],
      weights: [0.30, 0.25, 0.25, 0.20]
    },
    foundations: {
      names: ["Excavation Work", "Foundation Pouring", "Curing & Quality Check", "Backfilling & Compaction"],
      weights: [0.25, 0.35, 0.20, 0.20]
    },
    cabinet: {
      names: ["Cabinet Installation", "Electrical Connections", "Network Setup", "Equipment Mounting"],
      weights: [0.30, 0.25, 0.25, 0.20]
    },
    cable: {
      names: ["Cable Trenching", "Fiber Optic Laying", "Power Cable Installation", "Cable Termination & Testing"],
      weights: [0.25, 0.30, 0.25, 0.20]
    },
    controlRoom: {
      names: ["Room Renovation", "Server Installation", "Display Systems", "Control Systems Integration"],
      weights: [0.25, 0.30, 0.25, 0.20]
    },
    ppic3: {
      names: ["System Integration", "Software Deployment", "Testing & Commissioning", "Go-Live Preparation"],
      weights: [0.30, 0.25, 0.25, 0.20]
    }
  };

  const template = subProjectTemplates[phaseKey] || {
    names: ["Sub-Project 1", "Sub-Project 2", "Sub-Project 3"],
    weights: [0.33, 0.33, 0.34]
  };

  // Generate sub-projects with variance based on parent progress
  const variance = actualProgress - plannedProgress;
  
  return template.names.map((name, index) => {
    const weight = template.weights[index];
    const baseActual = actualProgress * (0.8 + Math.random() * 0.4); // Vary around parent
    const basePlanned = plannedProgress * (0.8 + Math.random() * 0.4);
    
    return {
      id: `${phaseKey}-${index}`,
      name,
      actualProgress: Math.min(100, Math.max(0, baseActual)),
      plannedProgress: Math.min(100, Math.max(0, basePlanned)),
      weight
    };
  });
};

// Helper to convert legacy data to new format
const convertToPhaseProgress = (
  currentValue: number,
  phaseKey: string,
  timelineData?: { month: string; [key: string]: number | string }[]
): PhaseProgress => {
  // Generate planned progress (typically 5-10% higher initially, then converges)
  const plannedProgress = Math.min(100, currentValue + (100 - currentValue) * 0.15);
  
  // Generate timeline if not provided
  const timeline = timelineData?.map(point => {
    const actual = (point[phaseKey] as number) || 0;
    const planned = Math.min(100, actual + (100 - actual) * 0.15);
    return {
      month: point.month as string,
      actual,
      planned
    };
  }) || [];

  return {
    actual: currentValue,
    planned: plannedProgress,
    subProjects: generateSubProjects(phaseKey, currentValue, plannedProgress),
    timeline: timeline.length > 0 ? timeline : undefined
  };
};

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

// Color palette for cards
const CARD_COLORS = ["emerald", "blue", "orange", "purple", "indigo", "teal", "pink", "cyan", "amber", "red"];

export default function Dashboard() {
  const [viewType, setViewType] = useState<"divisions" | "districts" | "tehsils" | "">("");
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<"division" | "district" | "tehsil" | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Get available divisions - independent filter
  const divisions = useMemo(() => ["all", ...getAllDivisions()], []);

  // Get ALL districts from ALL divisions - independent filter
  const allDistricts = useMemo(() => {
    if (!PUNJAB_HIERARCHY || !Array.isArray(PUNJAB_HIERARCHY)) return [];
    const districtSet = new Set<string>();
      PUNJAB_HIERARCHY.forEach(div => {
      if (div?.districts) {
        div.districts.forEach(dist => {
          if (dist?.district) {
            districtSet.add(dist.district);
          }
        });
      }
    });
    return Array.from(districtSet).sort();
  }, []);

  // Get ALL tehsils from ALL divisions/districts - independent filter
  const allTehsils = useMemo(() => {
    if (!PUNJAB_HIERARCHY || !Array.isArray(PUNJAB_HIERARCHY)) return [];
    const tehsilSet = new Set<string>();
    PUNJAB_HIERARCHY.forEach(div => {
      if (div?.districts) {
      div.districts.forEach(dist => {
          if (dist?.tehsils) {
        dist.tehsils.forEach(teh => {
              if (teh?.tehsil) {
                tehsilSet.add(teh.tehsil);
              }
            });
          }
        });
      }
    });
    return Array.from(tehsilSet).sort();
  }, []);

  // Filter options - independent
  const districts = useMemo(() => ["all", ...allDistricts], [allDistricts]);
  const tehsils = useMemo(() => ["all", ...allTehsils], [allTehsils]);

  // Calculate aggregated data for all divisions/districts/tehsils
  const getAggregatedDataForView = (type: "divisions" | "districts" | "tehsils"): CityInstallationData => {
    let allItemsData: { surveys: number; foundations: number; cabinet: number; cable: number; controlRoom: number; ppic3: number; overall: number }[] = [];

    if (type === "divisions") {
      const divData = getAllDivisionData();
      allItemsData = Object.values(divData);
    } else if (type === "districts") {
      const distData = getAllDistrictData();
      allItemsData = Object.values(distData);
    } else if (type === "tehsils") {
      const tehData = getAllTehsilData();
      allItemsData = Object.values(tehData);
    }

    if (allItemsData.length === 0) {
      return {
        surveys: convertToPhaseProgress(0, "surveys"),
        foundations: convertToPhaseProgress(0, "foundations"),
        cabinet: convertToPhaseProgress(0, "cabinet"),
        cable: convertToPhaseProgress(0, "cable"),
        controlRoom: convertToPhaseProgress(0, "controlRoom"),
        ppic3: convertToPhaseProgress(0, "ppic3"),
        overall: 0,
        timeline: [],
      };
    }

    // Calculate averages
    const avgSurveys = Math.round(allItemsData.reduce((sum, d) => sum + d.surveys, 0) / allItemsData.length);
    const avgFoundations = Math.round(allItemsData.reduce((sum, d) => sum + d.foundations, 0) / allItemsData.length);
    const avgCabinet = Math.round(allItemsData.reduce((sum, d) => sum + d.cabinet, 0) / allItemsData.length);
    const avgCable = Math.round(allItemsData.reduce((sum, d) => sum + d.cable, 0) / allItemsData.length);
    const avgControlRoom = Math.round(allItemsData.reduce((sum, d) => sum + d.controlRoom, 0) / allItemsData.length);
    const avgPpic3 = Math.round(allItemsData.reduce((sum, d) => sum + d.ppic3, 0) / allItemsData.length);
    const avgOverall = Math.round(allItemsData.reduce((sum, d) => sum + d.overall, 0) / allItemsData.length);

    // Generate timeline data (6 months progression)
      const timeline = [
      { month: "Jan", surveys: Math.max(0, avgSurveys - 50), foundations: Math.max(0, avgFoundations - 75), cabinet: Math.max(0, avgCabinet - 73), cable: Math.max(0, avgCable - 70), controlRoom: Math.max(0, avgControlRoom - 60), ppic3: Math.max(0, avgPpic3 - 55), overall: Math.max(0, avgOverall - 60) },
      { month: "Feb", surveys: Math.max(0, avgSurveys - 30), foundations: Math.max(0, avgFoundations - 50), cabinet: Math.max(0, avgCabinet - 55), cable: Math.max(0, avgCable - 50), controlRoom: Math.max(0, avgControlRoom - 45), ppic3: Math.max(0, avgPpic3 - 40), overall: Math.max(0, avgOverall - 40) },
      { month: "Mar", surveys: Math.max(0, avgSurveys - 15), foundations: Math.max(0, avgFoundations - 30), cabinet: Math.max(0, avgCabinet - 35), cable: Math.max(0, avgCable - 30), controlRoom: Math.max(0, avgControlRoom - 25), ppic3: Math.max(0, avgPpic3 - 20), overall: Math.max(0, avgOverall - 20) },
      { month: "Apr", surveys: Math.max(0, avgSurveys - 8), foundations: Math.max(0, avgFoundations - 15), cabinet: Math.max(0, avgCabinet - 20), cable: Math.max(0, avgCable - 15), controlRoom: Math.max(0, avgControlRoom - 12), ppic3: Math.max(0, avgPpic3 - 10), overall: Math.max(0, avgOverall - 10) },
      { month: "May", surveys: Math.max(0, avgSurveys - 3), foundations: Math.max(0, avgFoundations - 8), cabinet: Math.max(0, avgCabinet - 10), cable: Math.max(0, avgCable - 8), controlRoom: Math.max(0, avgControlRoom - 5), ppic3: Math.max(0, avgPpic3 - 3), overall: Math.max(0, avgOverall - 3) },
      { month: "Jun", surveys: avgSurveys, foundations: avgFoundations, cabinet: avgCabinet, cable: avgCable, controlRoom: avgControlRoom, ppic3: avgPpic3, overall: avgOverall },
      ];
      
      return {
      surveys: convertToPhaseProgress(avgSurveys, "surveys", timeline),
      foundations: convertToPhaseProgress(avgFoundations, "foundations", timeline),
      cabinet: convertToPhaseProgress(avgCabinet, "cabinet", timeline),
      cable: convertToPhaseProgress(avgCable, "cable", timeline),
      controlRoom: convertToPhaseProgress(avgControlRoom, "controlRoom", timeline),
      ppic3: convertToPhaseProgress(avgPpic3, "ppic3", timeline),
      overall: avgOverall,
        timeline,
      };
  };

  // Get single item data function
  const getSingleItemData = (itemName: string, itemType: "division" | "district" | "tehsil"): CityInstallationData | null => {
    try {
      let itemData: InstallationData | undefined;

      if (itemType === "division") {
        const divData = getAllDivisionData();
        const key = itemName.toLowerCase().replace(/\s+/g, '');
        itemData = divData[key];
      } else if (itemType === "district") {
        const distData = getAllDistrictData();
        // Find the district key (format: division-district)
        const foundKey = Object.keys(distData).find(key => {
          const parts = key.split('-');
          return parts.length >= 2 && parts.slice(1).join('-') === itemName.toLowerCase().replace(/\s+/g, '');
        });
        if (foundKey) {
          itemData = distData[foundKey];
        }
      } else if (itemType === "tehsil") {
        const tehData = getAllTehsilData();
        // Find the tehsil key (format: division-district-tehsil)
        const foundKey = Object.keys(tehData).find(key => {
          const parts = key.split('-');
          return parts.length >= 3 && parts.slice(2).join('-') === itemName.toLowerCase().replace(/\s+/g, '');
        });
        if (foundKey) {
          itemData = tehData[foundKey];
        }
      }

      if (!itemData) return null;

      // Generate timeline data (6 months progression)
      const timeline = [
        { month: "Jan", surveys: Math.max(0, itemData.surveys - 50), foundations: Math.max(0, itemData.foundations - 75), cabinet: Math.max(0, itemData.cabinet - 73), cable: Math.max(0, itemData.cable - 70), controlRoom: Math.max(0, itemData.controlRoom - 60), ppic3: Math.max(0, itemData.ppic3 - 55), overall: Math.max(0, itemData.overall - 60) },
        { month: "Feb", surveys: Math.max(0, itemData.surveys - 30), foundations: Math.max(0, itemData.foundations - 50), cabinet: Math.max(0, itemData.cabinet - 55), cable: Math.max(0, itemData.cable - 50), controlRoom: Math.max(0, itemData.controlRoom - 45), ppic3: Math.max(0, itemData.ppic3 - 40), overall: Math.max(0, itemData.overall - 40) },
        { month: "Mar", surveys: Math.max(0, itemData.surveys - 15), foundations: Math.max(0, itemData.foundations - 30), cabinet: Math.max(0, itemData.cabinet - 35), cable: Math.max(0, itemData.cable - 30), controlRoom: Math.max(0, itemData.controlRoom - 25), ppic3: Math.max(0, itemData.ppic3 - 20), overall: Math.max(0, itemData.overall - 20) },
        { month: "Apr", surveys: Math.max(0, itemData.surveys - 8), foundations: Math.max(0, itemData.foundations - 15), cabinet: Math.max(0, itemData.cabinet - 20), cable: Math.max(0, itemData.cable - 15), controlRoom: Math.max(0, itemData.controlRoom - 12), ppic3: Math.max(0, itemData.ppic3 - 10), overall: Math.max(0, itemData.overall - 10) },
        { month: "May", surveys: Math.max(0, itemData.surveys - 3), foundations: Math.max(0, itemData.foundations - 8), cabinet: Math.max(0, itemData.cabinet - 10), cable: Math.max(0, itemData.cable - 8), controlRoom: Math.max(0, itemData.controlRoom - 5), ppic3: Math.max(0, itemData.ppic3 - 3), overall: Math.max(0, itemData.overall - 3) },
        { month: "Jun", surveys: itemData.surveys, foundations: itemData.foundations, cabinet: itemData.cabinet, cable: itemData.cable, controlRoom: itemData.controlRoom, ppic3: itemData.ppic3, overall: itemData.overall },
      ];

      return {
        surveys: convertToPhaseProgress(itemData.surveys, "surveys", timeline),
        foundations: convertToPhaseProgress(itemData.foundations, "foundations", timeline),
        cabinet: convertToPhaseProgress(itemData.cabinet, "cabinet", timeline),
        cable: convertToPhaseProgress(itemData.cable, "cable", timeline),
        controlRoom: convertToPhaseProgress(itemData.controlRoom, "controlRoom", timeline),
        ppic3: convertToPhaseProgress(itemData.ppic3, "ppic3", timeline),
        overall: itemData.overall,
        timeline,
      };
    } catch (error) {
      console.error('Error getting single item data:', error);
      return null;
    }
  };

  // Get single item data
  const singleItemData = useMemo(() => {
    if (selectedItemName && selectedItemType) {
      return getSingleItemData(selectedItemName, selectedItemType);
    }
    return null;
  }, [selectedItemName, selectedItemType]);

  // Get aggregated data based on view type
  const aggregatedData = useMemo(() => {
    if (viewType === "divisions") {
      return getAggregatedDataForView("divisions");
    } else if (viewType === "districts") {
      return getAggregatedDataForView("districts");
    } else if (viewType === "tehsils") {
      return getAggregatedDataForView("tehsils");
    }
    return null;
  }, [viewType]);

  // Get all divisions data for cards view
  const divisionsData = useMemo(() => {
    try {
      const divData = getAllDivisionData();
      const divisions = getAllDivisions();
      if (!divisions || !Array.isArray(divisions)) return [];
      return divisions.map((div, index) => {
        const key = div.toLowerCase().replace(/\s+/g, '');
      return {
          name: div,
          overall: divData[key]?.overall || 0,
          data: divData[key],
          color: CARD_COLORS[index % CARD_COLORS.length]
        };
      });
    } catch (error) {
      console.error('Error loading divisions data:', error);
      return [];
    }
  }, []);

  // Get ALL districts data for cards view (from all divisions)
  const districtsData = useMemo(() => {
    try {
      if (!PUNJAB_HIERARCHY || !Array.isArray(PUNJAB_HIERARCHY)) return [];
      const distData = getAllDistrictData();
      // Get all unique districts with their data
      const districtMap = new Map<string, { overall: number; data: any; color: string }>();
      
      PUNJAB_HIERARCHY.forEach((div, divIndex) => {
        if (div?.districts) {
          div.districts.forEach((dist, distIndex) => {
            if (dist?.district && !districtMap.has(dist.district)) {
              // Try to find data for this district (may exist in multiple divisions)
              const possibleKeys = PUNJAB_HIERARCHY
                .filter(d => d?.districts?.some(dd => dd?.district === dist.district))
                .map(d => `${d.division}-${dist.district}`.toLowerCase().replace(/\s+/g, ''));
              
              let overall = 0;
              for (const key of possibleKeys) {
                if (distData[key]) {
                  overall = distData[key].overall;
                  break;
                }
              }
              
              districtMap.set(dist.district, {
                overall: overall || Math.floor(Math.random() * 40) + 40, // Fallback
                data: distData[possibleKeys[0]] || null,
                color: CARD_COLORS[(divIndex + distIndex) % CARD_COLORS.length]
              });
            }
          });
        }
      });
      
      return Array.from(districtMap.entries()).map(([name, info], index) => ({
        name,
        overall: info.overall,
        data: info.data,
        color: info.color
      }));
    } catch (error) {
      console.error('Error loading districts data:', error);
      return [];
    }
  }, []);

  // Get ALL tehsils data for cards view (from all divisions/districts)
  const tehsilsData = useMemo(() => {
    try {
      if (!PUNJAB_HIERARCHY || !Array.isArray(PUNJAB_HIERARCHY)) return [];
      const tehData = getAllTehsilData();
      const tehsilMap = new Map<string, { overall: number; data: any; color: string }>();
      
      PUNJAB_HIERARCHY.forEach((div, divIndex) => {
        if (div?.districts) {
          div.districts.forEach((dist, distIndex) => {
            if (dist?.tehsils) {
              dist.tehsils.forEach((teh, tehIndex) => {
                if (teh?.tehsil && !tehsilMap.has(teh.tehsil)) {
                  const possibleKeys = PUNJAB_HIERARCHY
                    .flatMap(d => d?.districts
                      ?.filter(dd => dd?.tehsils?.some(tt => tt?.tehsil === teh.tehsil))
                      .map(dd => `${d.division}-${dd.district}-${teh.tehsil}`.toLowerCase().replace(/\s+/g, '')) || []
                    );
                  
                  let overall = 0;
                  for (const key of possibleKeys) {
                    if (tehData[key]) {
                      overall = tehData[key].overall;
                      break;
                    }
                  }
                  
                  tehsilMap.set(teh.tehsil, {
                    overall: overall || Math.floor(Math.random() * 40) + 40, // Fallback
                    data: tehData[possibleKeys[0]] || null,
                    color: CARD_COLORS[(divIndex + distIndex + tehIndex) % CARD_COLORS.length]
                  });
                }
              });
            }
          });
        }
      });
      
      return Array.from(tehsilMap.entries()).map(([name, info]) => ({
        name,
        overall: info.overall,
        data: info.data,
        color: info.color
      }));
    } catch (error) {
      console.error('Error loading tehsils data:', error);
      return [];
    }
  }, []);

  // Render aggregated charts function
  const renderAggregatedCharts = (title: string, data: CityInstallationData) => {
    return (
      <>
        {/* Installation Phase Cards */}
        <div className="w-full">
          <div className="mb-3">
            <h2 className="text-xl font-bold font-heading mb-1">Project Milestones</h2>
            <p className="text-sm text-muted-foreground">Progress breakdown for {title}</p>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {installationPhases.map((phase) => {
              const progress = data[phase.key];
              const progressValue = getProgressValue(progress);
              const hasDetails = hasDetailedProgress(progress);
              
              return (
                <InstallationCard
                  key={`${title}-${phase.key}`}
                  title={phase.title}
                  percentage={progressValue}
                  icon={phase.icon}
                  color={phase.color}
                  actualProgress={hasDetails ? progress.actual : undefined}
                  plannedProgress={hasDetails ? progress.planned : undefined}
                  subProjects={hasDetails ? progress.subProjects : undefined}
                />
              );
            })}
          </div>
        </div>

        {/* Overall Progress Card */}
        <Card className="relative overflow-hidden border-2 border-primary/20 shadow-xl bg-gradient-to-br from-card to-card/95">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <CardContent className="relative p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold font-heading">Overall Progress</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Combined progress across all milestone progress for {title}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-center md:text-right">
                <div className="inline-block">
                  <div className="text-6xl font-bold font-heading bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent tabular-nums">
                    {data.overall}
                    <span className="text-3xl">%</span>
                  </div>
                  <div className="mt-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 inline-block">
                    <span className="text-sm font-semibold text-primary">
                      {data.overall === 100 ? "Fully Completed" : 
                       data.overall >= 80 ? "Near Completion" : 
                       data.overall >= 50 ? "In Progress" : "Early Stage"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <div className="relative h-5 w-full overflow-hidden rounded-full bg-muted/60 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary transition-all duration-1000 ease-out rounded-full shadow-lg relative overflow-hidden"
                  style={{ width: `${data.overall}%` }}
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

        {/* Charts Grid */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold font-heading mb-1">Analytics & Insights</h2>
            <p className="text-sm text-muted-foreground">Detailed progress analysis for {title}</p>
          </div>
          
          <div className="grid gap-4 lg:grid-cols-12">
            {/* Progress Timeline Chart */}
            <div className="lg:col-span-7">
              <TrendChart cityData={data.timeline} cityKey={title} />
            </div>

            {/* Phase Breakdown Chart */}
            <div className="lg:col-span-5">
              <PhaseBreakdownChart 
                data={installationPhases.map(phase => ({
                  phase: phase.title,
                  percentage: getProgressValue(data[phase.key]),
                }))}
              />
            </div>
          </div>

          {/* Phase Distribution Pie Chart */}
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-12">
              <PhaseDistributionChart 
                data={installationPhases.map(phase => ({
                  phase: phase.title,
                  percentage: getProgressValue(data[phase.key]),
                }))}
              />
            </div>
          </div>

          {/* Planned vs Actual Charts for Each Phase */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold font-heading mb-2">Planned vs Actual Progress</h3>
              <p className="text-sm text-muted-foreground">Compare actual progress against planned milestones for each project phase</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {installationPhases.map((phase) => {
                const progress = data[phase.key];
                if (!hasDetailedProgress(progress) || !progress.timeline) return null;
                
                const colorMap: Record<string, string> = {
                  blue: "#3b82f6",
                  green: "#10b981",
                  orange: "#f59e0b",
                  purple: "#a855f7",
                  red: "#ef4444",
                  yellow: "#eab308",
                };
                
                return (
                  <PlannedVsActualChart
                    key={`planned-actual-${phase.key}`}
                    phaseName={phase.title}
                    timelineData={progress.timeline}
                    color={colorMap[phase.color] || "#6b7280"}
                  />
                );
              })}
            </div>
          </div>

          {/* Phase Timeline Chart */}
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-12">
              <PhaseTimelineChart 
                timelineData={data.timeline}
                cityKey={title}
              />
            </div>
          </div>
        </div>
      </>
    );
  };

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
    <Layout title="PSCA Progress Dashboard">
      <div className="flex flex-col gap-4">
        {/* Top Header Section - Enhanced Design with Filter Bar */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 shadow-lg">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
          
          {/* Filter Bar Section - Radio Buttons */}
          <div className="relative border-b border-border/30 pb-3 px-6 pt-4">
            <div className="flex items-center gap-6 flex-nowrap">
              {/* Filters Label */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">View:</span>
              </div>

              {/* Radio Button Group */}
              <RadioGroup 
                value={viewType} 
                onValueChange={(value) => {
                  setViewType(value as "divisions" | "districts" | "tehsils" | "");
                  setSelectedItemName(null);
                  setSelectedItemType(null);
                }}
                className="flex items-center gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="divisions" id="divisions" />
                  <Label htmlFor="divisions" className="text-sm font-medium text-foreground cursor-pointer">
                    All Divisions
                  </Label>
              </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="districts" id="districts" />
                  <Label htmlFor="districts" className="text-sm font-medium text-foreground cursor-pointer">
                    All Districts
                  </Label>
              </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tehsils" id="tehsils" />
                  <Label htmlFor="tehsils" className="text-sm font-medium text-foreground cursor-pointer">
                    All Tehsils
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Header Content Section */}
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                  <Camera className="h-6 w-6 text-white" />
            </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold font-heading bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {viewType === "divisions" ? "All Punjab Divisions" : 
                     viewType === "districts" ? "All Punjab Districts" : 
                     viewType === "tehsils" ? "All Punjab Tehsils" : 
                     "PSCA Progress Dashboard"}
                  </h1>
                </div>
              </div>
              {aggregatedData && (
              <div className="flex items-center gap-3">
                <Badge className="px-4 py-1.5 text-sm font-semibold bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                    Overall: {aggregatedData.overall}%
                </Badge>
            </div>
              )}
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
              {aggregatedData && viewType && (
            <Button
              className="rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm font-semibold"
              onClick={async () => {
                try {
                  await exportDashboardToPPTX({
                        cityName: viewType === "divisions" ? "All Punjab Divisions" : 
                                 viewType === "districts" ? "All Punjab Districts" : 
                                 "All Punjab Tehsils",
                        cityData: {
                          surveys: getProgressValue(aggregatedData.surveys),
                          foundations: getProgressValue(aggregatedData.foundations),
                          cabinet: getProgressValue(aggregatedData.cabinet),
                          cable: getProgressValue(aggregatedData.cable),
                          controlRoom: getProgressValue(aggregatedData.controlRoom),
                          ppic3: getProgressValue(aggregatedData.ppic3),
                          overall: aggregatedData.overall,
                          timeline: aggregatedData.timeline,
                        },
                    installationPhases: installationPhases.map(phase => ({
                      key: phase.key,
                      title: phase.title,
                          percentage: getProgressValue(aggregatedData[phase.key]),
                    })),
                  });
                  setShowSuccessDialog(true);
                } catch (error) {
                  console.error('Error exporting to PPTX:', error);
                  setShowErrorDialog(true);
                }
              }}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export Operation pptx
            </Button>
              )}
            </div>
          </div>
        </div>

        {/* Single Item Detail View */}
        {selectedItemName && selectedItemType && singleItemData && (
          <div className="space-y-6">
            {/* Back Button */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedItemName(null);
                  setSelectedItemType(null);
                }}
                className="rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {viewType === "divisions" ? "Divisions" : viewType === "districts" ? "Districts" : "Tehsils"}
              </Button>
              <div>
                <h2 className="text-2xl font-bold font-heading">{selectedItemName}</h2>
                <p className="text-sm text-muted-foreground">Detailed progress with actual vs planned</p>
              </div>
            </div>

            {/* Detailed View */}
            {renderAggregatedCharts(selectedItemName, singleItemData)}
          </div>
        )}

        {/* Hierarchy Cards View with Charts */}
        {!selectedItemName && viewType === "divisions" && aggregatedData && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold font-heading mb-1">All Punjab Divisions</h2>
              <p className="text-sm text-muted-foreground">Overall progress across all divisions of Punjab</p>
            </div>
            
            {/* Division Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {divisionsData.map((div) => (
                <HierarchyCard
                  key={div.name}
                  title={div.name}
                  overallProgress={div.overall}
                  color={div.color}
                  onClick={() => {
                    setSelectedItemName(div.name);
                    setSelectedItemType("division");
                  }}
                />
              ))}
        </div>

            {/* Aggregated Charts Section - Same as detail view */}
            {renderAggregatedCharts("All Punjab Divisions", aggregatedData)}
          </div>
        )}

        {!selectedItemName && viewType === "districts" && aggregatedData && (
          <div className="space-y-6">
                    <div>
              <h2 className="text-xl font-bold font-heading mb-1">All Punjab Districts</h2>
              <p className="text-sm text-muted-foreground">Overall progress across all districts of Punjab</p>
                    </div>
            
            {/* District Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {districtsData.map((dist) => (
                <HierarchyCard
                  key={dist.name}
                  title={dist.name}
                  overallProgress={dist.overall}
                  color={dist.color}
                  onClick={() => {
                    setSelectedItemName(dist.name);
                    setSelectedItemType("district");
                  }}
                />
              ))}
                  </div>

            {/* Aggregated Charts Section */}
            {renderAggregatedCharts("All Punjab Districts", aggregatedData)}
                      </div>
        )}

        {!selectedItemName && viewType === "tehsils" && aggregatedData && (
          <div className="space-y-6">
          <div>
              <h2 className="text-xl font-bold font-heading mb-1">All Punjab Tehsils</h2>
              <p className="text-sm text-muted-foreground">Overall progress across all tehsils of Punjab</p>
                   </div>
          
            {/* Tehsil Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tehsilsData.map((teh) => (
                <HierarchyCard
                  key={teh.name}
                  title={teh.name}
                  overallProgress={teh.overall}
                  color={teh.color}
                  onClick={() => {
                    setSelectedItemName(teh.name);
                    setSelectedItemType("tehsil");
                  }}
                />
              ))}
          </div>

            {/* Aggregated Charts Section */}
            {renderAggregatedCharts("All Punjab Tehsils", aggregatedData)}
        </div>
        )}

      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center gap-4 mb-2">
              <img 
                src="/Assets/psca logo.png" 
                alt="PSCA Logo" 
                className="h-16 w-16 object-contain"
              />
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <DialogTitle className="text-xl font-bold">Export Successful!</DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-center pt-2">
              PowerPoint presentation exported successfully!
              <br />
              <br />
              The PPTX file includes all KPIs with proper icons and all charts based on your current filter selection.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setShowSuccessDialog(false)} className="w-full sm:w-auto">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center gap-4 mb-2">
              <img 
                src="/Assets/psca logo.png" 
                alt="PSCA Logo" 
                className="h-16 w-16 object-contain"
              />
              <DialogTitle className="text-xl font-bold">Export Error</DialogTitle>
            </div>
            <DialogDescription className="text-center pt-2">
              {!viewType
                ? "Please select a view type (All Divisions, All Districts, or All Tehsils) to export the presentation."
                : "Error exporting presentation. Please try again."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setShowErrorDialog(false)} className="w-full sm:w-auto">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
