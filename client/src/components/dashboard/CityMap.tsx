import { MapContainer, TileLayer, Marker, Popup, Circle, LayersControl, LayerGroup, Polyline } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { Camera, AlertTriangle, Truck, Shield, Activity, Landmark } from "lucide-react";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons for better visualization
const getPoliceIcon = () => L.divIcon({
  className: 'police-station-icon',
  html: `<div class="p-1.5 bg-primary rounded-lg border-2 border-white shadow-xl"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const getPatrolIcon = (color: string) => L.divIcon({
  className: 'patrol-unit-icon',
  html: `<div class="p-1 bg-${color} rounded-full border-2 border-white shadow-lg animate-pulse"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M15 18H9"/></svg></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const MOCK_DATA = {
  cameras: [
    { id: 1, pos: [31.5204, 74.3587], status: "Online", type: "PTZ", alerts: 2, label: "Mall Road Sector 1" },
    { id: 2, pos: [31.5497, 74.3436], status: "Offline", type: "Fixed", alerts: 0, label: "Gulberg Main Blvd" },
  ],
  incidents: [
    { id: 1, pos: [31.5100, 74.3300], type: "Traffic Accident", severity: "High", time: "10:15 AM", status: "Responding" },
    { id: 2, pos: [31.5550, 74.3100], type: "Suspicious Activity", severity: "Medium", time: "10:30 AM", status: "Pending" },
  ],
  patrols: [
    { id: 1, pos: [31.5300, 74.3400], label: "Dolphin Unit 102", status: "Active", type: "Motorcycle", color: "emerald-500" },
    { id: 2, pos: [31.4800, 74.2800], label: "PRU Unit 45", status: "Idle", type: "Car", color: "blue-500" },
  ],
  stations: [
    { id: 1, pos: [31.5250, 74.3600], name: "Model Town PS", units: 12, radius: 2000 },
    { id: 2, pos: [31.4900, 74.3000], name: "Gulberg PS", units: 15, radius: 1500 },
  ],
  traffic: [
    { id: 1, path: [[31.520, 74.358], [31.540, 74.358], [31.560, 74.350]], level: "High", speed: "12 km/h" },
    { id: 2, path: [[31.500, 74.300], [31.520, 74.320], [31.540, 74.340]], level: "Low", speed: "45 km/h" },
  ]
};

export function CityMap() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-[600px] w-full bg-muted animate-pulse rounded-xl" />;
  }

  return (
    <div className="h-[650px] w-full rounded-xl overflow-hidden border shadow-2xl relative z-0 group">
      <MapContainer 
        center={[31.5204, 74.3587]} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%" }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Operational Dark">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Street View">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay checked name="CCTV Coverage">
            <LayerGroup>
              {MOCK_DATA.cameras.map(cam => (
                <Circle 
                  key={cam.id} 
                  center={cam.pos as [number, number]} 
                  radius={cam.status === 'Online' ? 300 : 50}
                  pathOptions={{ 
                    color: cam.status === 'Online' ? '#3b82f6' : '#ef4444', 
                    fillOpacity: 0.2 
                  }}
                >
                  <Popup>
                    <div className="p-2 w-48 font-sans">
                      <div className="flex items-center gap-2 border-b pb-2 mb-2">
                        <Camera className="h-4 w-4 text-primary" />
                        <span className="font-bold text-sm">{cam.label}</span>
                      </div>
                      <div className="space-y-1 text-xs font-mono">
                        <p>STATUS: <span className={cam.status === 'Online' ? 'text-emerald-500' : 'text-destructive'}>{cam.status}</span></p>
                        <p>TYPE: {cam.type}</p>
                        <p>ALERTS: {cam.alerts}</p>
                      </div>
                      <button className="w-full mt-3 bg-primary text-white text-[10px] py-1.5 rounded uppercase font-bold tracking-widest hover:bg-primary/90">Request Feed</button>
                    </div>
                  </Popup>
                </Circle>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Patrol Units">
            <LayerGroup>
              {MOCK_DATA.patrols.map(unit => (
                <Marker key={unit.id} position={unit.pos as [number, number]} icon={getPatrolIcon(unit.color)}>
                  <Popup>
                    <div className="p-2 text-xs">
                      <p className="font-bold border-b pb-1 mb-1">{unit.label}</p>
                      <p>TYPE: {unit.type}</p>
                      <p>STATUS: {unit.status}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Police Stations">
            <LayerGroup>
              {MOCK_DATA.stations.map(station => (
                <LayerGroup key={station.id}>
                  <Marker position={station.pos as [number, number]} icon={getPoliceIcon()}>
                    <Popup>
                      <div className="p-2 text-xs">
                        <p className="font-bold">{station.name}</p>
                        <p>ACTIVE UNITS: {station.units}</p>
                      </div>
                    </Popup>
                  </Marker>
                  <Circle center={station.pos as [number, number]} radius={station.radius} pathOptions={{ color: 'rgba(30, 58, 138, 0.2)', dashArray: '5, 10' }} />
                </LayerGroup>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Traffic Density">
            <LayerGroup>
              {MOCK_DATA.traffic.map(route => (
                <Polyline 
                  key={route.id} 
                  positions={route.path as [number, number][]} 
                  pathOptions={{ 
                    color: route.level === 'High' ? '#ef4444' : '#10b981', 
                    weight: 6,
                    opacity: 0.8
                  }}
                >
                  <Popup>
                    <div className="text-xs">
                      <p className="font-bold">Congestion: {route.level}</p>
                      <p>Avg Speed: {route.speed}</p>
                    </div>
                  </Popup>
                </Polyline>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Incident Heatmap">
            <LayerGroup>
              <Circle center={[31.52, 74.33]} radius={2000} pathOptions={{ color: 'none', fillColor: '#ef4444', fillOpacity: 0.1 }} />
              <Circle center={[31.52, 74.33]} radius={1200} pathOptions={{ color: 'none', fillColor: '#ef4444', fillOpacity: 0.2 }} />
              <Circle center={[31.52, 74.33]} radius={600} pathOptions={{ color: 'none', fillColor: '#ef4444', fillOpacity: 0.4 }} />
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>

      {/* Real-time Status Floating Bar */}
      <div className="absolute bottom-6 left-6 right-6 z-[400] flex justify-between pointer-events-none">
        <div className="bg-primary text-white px-4 py-2 rounded-lg shadow-2xl border border-white/10 backdrop-blur pointer-events-auto flex items-center gap-4">
          <div className="flex items-center gap-2 border-r pr-4 border-white/20">
            <Activity className="h-4 w-4 text-secondary" />
            <span className="text-xs font-bold uppercase tracking-widest">Map Engine Live</span>
          </div>
          <div className="flex gap-4 text-[10px] font-mono">
            <span>CAMS: 4,500</span>
            <span className="text-secondary">ALERTS: 12</span>
            <span className="text-emerald-400">PATROLS: 86</span>
          </div>
        </div>
      </div>
    </div>
  );
}