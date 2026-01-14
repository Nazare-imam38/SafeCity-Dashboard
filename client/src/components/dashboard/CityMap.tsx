import { MapContainer, TileLayer, Marker, Popup, Circle, LayersControl, LayerGroup } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { Shield, Camera, AlertCircle, Truck } from "lucide-react";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const MOCK_CAMERAS = [
  { id: 1, pos: [31.5204, 74.3587], status: "active", label: "Mall Road Cam 01" },
  { id: 2, pos: [31.5497, 74.3436], status: "active", label: "Gulberg Main Blvd" },
  { id: 3, pos: [31.4805, 74.2809], status: "alert", label: "Johar Town Intersection" },
];

const MOCK_PATROL_UNITS = [
  { id: 1, pos: [31.5300, 74.3500], status: "patrolling", label: "Unit 402 - Dolphin" },
  { id: 2, pos: [31.5100, 74.3200], status: "responding", label: "Unit 115 - Highway" },
];

const MOCK_INCIDENTS = [
  { id: 1, pos: [31.5000, 74.3400], type: "Accident", severity: "high" },
  { id: 2, pos: [31.5400, 74.3100], type: "Crowd", severity: "medium" },
];

export function CityMap() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-[500px] w-full bg-muted animate-pulse rounded-xl" />;
  }

  const center = [31.5204, 74.3587] as [number, number];

  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden border shadow-xl relative z-0">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%" }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Dark Mode">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Street View">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay checked name="CCTV Cameras">
            <LayerGroup>
              {MOCK_CAMERAS.map((cam) => (
                <Circle 
                  key={cam.id}
                  center={cam.pos as [number, number]}
                  radius={200}
                  pathOptions={{ 
                    color: cam.status === 'alert' ? '#ef4444' : '#3b82f6',
                    fillColor: cam.status === 'alert' ? '#ef4444' : '#3b82f6',
                    fillOpacity: 0.6,
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[150px]">
                      <div className="flex items-center gap-2 mb-2">
                        <Camera className="h-4 w-4 text-primary" />
                        <h3 className="font-bold font-heading">{cam.label}</h3>
                      </div>
                      <div className="aspect-video bg-black rounded flex items-center justify-center mb-2">
                        <span className="text-[10px] text-white/50 animate-pulse font-mono uppercase tracking-tighter italic">LIVE Feed • CAM_{cam.id}</span>
                      </div>
                      <p className="text-xs uppercase font-mono">Status: <span className={cam.status === 'alert' ? 'text-destructive' : 'text-primary'}>{cam.status}</span></p>
                    </div>
                  </Popup>
                </Circle>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Patrol Units">
            <LayerGroup>
              {MOCK_PATROL_UNITS.map((unit) => (
                <Marker 
                  key={unit.id} 
                  position={unit.pos as [number, number]}
                  icon={L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div class="p-1 bg-emerald-500 rounded-full border-2 border-white shadow-lg animate-bounce"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-4.493-1.498A2 2 0 0 1 15 9.354V6"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg></div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                  })}
                >
                  <Popup>
                    <div className="p-2">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-emerald-500" />
                        <span className="font-bold">{unit.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 uppercase">{unit.status}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Heatmap (Incidents)">
            <LayerGroup>
              {MOCK_INCIDENTS.map((inc) => (
                <Circle 
                  key={inc.id}
                  center={inc.pos as [number, number]}
                  radius={1000}
                  pathOptions={{ 
                    color: '#f97316',
                    fillColor: '#f97316',
                    fillOpacity: 0.2,
                    stroke: false
                  }}
                />
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>
      
      {/* Map Overlay Controls */}
      <div className="absolute top-4 left-16 z-[400] bg-card/90 backdrop-blur p-3 rounded-lg border shadow-lg hidden md:block">
         <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Map Legend</h4>
         <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div> CCTV Network
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Patrol Units
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div> Incident Zone
            </div>
         </div>
      </div>
    </div>
  );
}