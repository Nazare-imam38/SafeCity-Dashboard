import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FolderKanban, Plus, Upload, FileText, MapPin, X, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState, useMemo, useEffect } from "react";
import { getAllDivisions, getDistrictsByDivision, getTehsilsByDivisionAndDistrict } from "@/data/punjabHierarchy";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to fit map bounds to GeoJSON
function GeoJSONFitBounds({ data }: { data: any }) {
  const map = useMap();
  useEffect(() => {
    if (data) {
      try {
        const layer = L.geoJSON(data);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 15,
            animate: true,
            duration: 1.5
          });
        }
      } catch (err) {
        console.error("Error fitting map to GeoJSON:", err);
      }
    }
  }, [data, map]);
  return null;
}

// Map component for displaying project area
function ProjectAreaMap({ geoData }: { geoData: any }) {
  const [isMounted, setIsMounted] = useState(false);
  const center: [number, number] = [31.5204, 74.3587]; // Default to Lahore

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={center}
        zoom={10}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoData && (
          <>
            <GeoJSON data={geoData} style={{ color: "#3b82f6", weight: 3, fillColor: "#3b82f6", fillOpacity: 0.2 }} />
            <GeoJSONFitBounds data={geoData} />
          </>
        )}
      </MapContainer>
    </div>
  );
}

export default function ProjectManagement() {
  const [showAddProjectDialog, setShowAddProjectDialog] = useState(false);
  const [showXERDialog, setShowXERDialog] = useState(false);
  const [showAreaDialog, setShowAreaDialog] = useState(false);
  
  // Form state
  const [projectName, setProjectName] = useState("");
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedTehsil, setSelectedTehsil] = useState<string>("");
  const [xerFile, setXerFile] = useState<File | null>(null);
  const [areaFile, setAreaFile] = useState<File | null>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [isLoadingGeoData, setIsLoadingGeoData] = useState(false);

  // Get divisions
  const divisions = useMemo(() => getAllDivisions(), []);

  // Get districts based on selected division
  const districts = useMemo(() => {
    if (!selectedDivision) return [];
    return getDistrictsByDivision(selectedDivision);
  }, [selectedDivision]);

  // Get tehsils based on selected division and district
  const tehsils = useMemo(() => {
    if (!selectedDivision || !selectedDistrict) return [];
    return getTehsilsByDivisionAndDistrict(selectedDivision, selectedDistrict);
  }, [selectedDivision, selectedDistrict]);

  // Reset district and tehsil when division changes
  useEffect(() => {
    setSelectedDistrict("");
    setSelectedTehsil("");
  }, [selectedDivision]);

  // Reset tehsil when district changes
  useEffect(() => {
    setSelectedTehsil("");
  }, [selectedDistrict]);

  // Handle XER file upload
  const handleXERFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.xer')) {
        alert('Please select a valid .xer file');
        return;
      }
      setXerFile(file);
    }
  };

  // Handle area file upload (GeoJSON, KML, KMZ, Shapefile)
  const handleAreaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const extension = fileName.split('.').pop();

    setIsLoadingGeoData(true);

    try {
      if (extension === 'geojson' || extension === 'json') {
        // Handle GeoJSON
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const jsonData = JSON.parse(event.target?.result as string);
            setGeoData(jsonData);
            setAreaFile(file);
            setIsLoadingGeoData(false);
          } catch (err) {
            console.error("Error parsing GeoJSON:", err);
            alert("Error parsing GeoJSON file. Please ensure it's a valid GeoJSON file.");
            setIsLoadingGeoData(false);
          }
        };
        reader.readAsText(file);
      } else if (extension === 'kml' || extension === 'kmz') {
        // For KML/KMZ, we'll store the file but note that full parsing requires additional libraries
        // For now, we'll show a message that KML/KMZ support is coming
        setAreaFile(file);
        alert("KML/KMZ file uploaded. Full parsing support coming soon. For now, please use GeoJSON format.");
        setIsLoadingGeoData(false);
      } else if (extension === 'zip' || extension === 'shp') {
        // For Shapefile, we'll store the file but note that parsing requires shapefile.js
        setAreaFile(file);
        alert("Shapefile uploaded. Full parsing support coming soon. For now, please use GeoJSON format.");
        setIsLoadingGeoData(false);
      } else {
        alert("Unsupported file format. Please upload GeoJSON, KML, KMZ, or Shapefile (ZIP).");
        setIsLoadingGeoData(false);
      }
    } catch (err) {
      console.error("Error handling area file:", err);
      alert("Error processing file. Please try again.");
      setIsLoadingGeoData(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setProjectName("");
    setSelectedDivision("");
    setSelectedDistrict("");
    setSelectedTehsil("");
    setXerFile(null);
    setAreaFile(null);
    setGeoData(null);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectName.trim()) {
      alert("Please enter a project name");
      return;
    }
    if (!selectedDivision) {
      alert("Please select a division");
      return;
    }
    if (!selectedDistrict) {
      alert("Please select a district");
      return;
    }
    if (!selectedTehsil) {
      alert("Please select a tehsil");
      return;
    }
    if (!xerFile) {
      alert("Please upload an XER file");
      return;
    }
    if (!areaFile) {
      alert("Please upload a project area file");
      return;
    }

    // Here you would typically send the data to your backend
    console.log("Project Data:", {
      projectName,
      division: selectedDivision,
      district: selectedDistrict,
      tehsil: selectedTehsil,
      xerFile,
      areaFile,
      geoData
    });

    alert("Project created successfully!");
    resetForm();
    setShowAddProjectDialog(false);
    setShowXERDialog(false);
    setShowAreaDialog(false);
  };

  return (
    <Layout title="Project Management">
      <div className="space-y-6">
        {/* Header with Add Project Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Project Management</h1>
            <p className="text-muted-foreground">Create and manage Safe City projects</p>
          </div>
          <Button onClick={() => setShowAddProjectDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Project
          </Button>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Get started by creating a new project</p>
            <Button onClick={() => setShowAddProjectDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Project
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Add Project Dialog */}
      <Dialog open={showAddProjectDialog} onOpenChange={setShowAddProjectDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
            <DialogDescription>
              Fill in the project details and upload required files
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </div>

            {/* Division Select */}
            <div className="space-y-2">
              <Label htmlFor="division">Division *</Label>
              <Select value={selectedDivision} onValueChange={setSelectedDivision} required>
                <SelectTrigger id="division">
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((division) => (
                    <SelectItem key={division} value={division}>
                      {division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* District Select */}
            <div className="space-y-2">
              <Label htmlFor="district">District *</Label>
              <Select
                value={selectedDistrict}
                onValueChange={setSelectedDistrict}
                disabled={!selectedDivision}
                required
              >
                <SelectTrigger id="district">
                  <SelectValue placeholder={selectedDivision ? "Select district" : "Select division first"} />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tehsil Select */}
            <div className="space-y-2">
              <Label htmlFor="tehsil">Tehsil *</Label>
              <Select
                value={selectedTehsil}
                onValueChange={setSelectedTehsil}
                disabled={!selectedDistrict}
                required
              >
                <SelectTrigger id="tehsil">
                  <SelectValue placeholder={selectedDistrict ? "Select tehsil" : "Select district first"} />
                </SelectTrigger>
                <SelectContent>
                  {tehsils.map((tehsil) => (
                    <SelectItem key={tehsil} value={tehsil}>
                      {tehsil}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* XER File Upload */}
            <div className="space-y-2">
              <Label>XER File *</Label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-all ${
                  xerFile
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/20 hover:border-primary/50 cursor-pointer"
                }`}
                onClick={() => !xerFile && setShowXERDialog(true)}
              >
                {xerFile ? (
                  <div className="flex items-center gap-3 w-full">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{xerFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(xerFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setXerFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Click to upload XER file</p>
                    <p className="text-xs text-muted-foreground">.xer format</p>
                  </>
                )}
              </div>
            </div>

            {/* Project Area File Upload */}
            <div className="space-y-2">
              <Label>Project Area (GeoJSON, Shapefile, KMZ, KML) *</Label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-all ${
                  areaFile
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/20 hover:border-primary/50 cursor-pointer"
                }`}
                onClick={() => !areaFile && setShowAreaDialog(true)}
              >
                {areaFile ? (
                  <div className="flex items-center gap-3 w-full">
                    <MapPin className="h-8 w-8 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{areaFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(areaFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAreaFile(null);
                        setGeoData(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Click to upload area file</p>
                    <p className="text-xs text-muted-foreground">GeoJSON, Shapefile, KMZ, or KML</p>
                  </>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowAddProjectDialog(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">Create Project</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* XER File Upload Dialog */}
      <Dialog open={showXERDialog} onOpenChange={setShowXERDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload XER File</DialogTitle>
            <DialogDescription>
              Upload your Primavera P6 XER file for project scheduling
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className="relative border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-all hover:border-primary/50 cursor-pointer"
              onClick={() => document.getElementById("xer-file-input")?.click()}
            >
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">Click to upload XER file</p>
              <p className="text-xs text-muted-foreground">.xer format only</p>
              <Input
                id="xer-file-input"
                type="file"
                accept=".xer"
                onChange={handleXERFileChange}
                className="hidden"
              />
            </div>
            {xerFile && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <File className="h-5 w-5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{xerFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(xerFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowXERDialog(false)}>
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (xerFile) {
                  setShowXERDialog(false);
                } else {
                  alert("Please select an XER file first");
                }
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Area Upload Dialog */}
      <Dialog open={showAreaDialog} onOpenChange={setShowAreaDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Project Area</DialogTitle>
            <DialogDescription>
              Upload geographic boundary files (GeoJSON, Shapefile, KMZ, or KML) and preview on map
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className="relative border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-all hover:border-primary/50 cursor-pointer"
              onClick={() => document.getElementById("area-file-input")?.click()}
            >
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">Click to upload area file</p>
              <p className="text-xs text-muted-foreground">
                GeoJSON, Shapefile (.zip), KMZ, or KML formats
              </p>
              <Input
                id="area-file-input"
                type="file"
                accept=".geojson,.json,.kml,.kmz,.zip,.shp"
                onChange={handleAreaFileChange}
                className="hidden"
              />
            </div>
            {areaFile && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <File className="h-5 w-5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{areaFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(areaFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            )}
            {isLoadingGeoData && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading geographic data...</p>
              </div>
            )}
            {geoData && (
              <div className="space-y-2">
                <Label>Map Preview</Label>
                <ProjectAreaMap geoData={geoData} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowAreaDialog(false)}>
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (areaFile) {
                  setShowAreaDialog(false);
                } else {
                  alert("Please select an area file first");
                }
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
