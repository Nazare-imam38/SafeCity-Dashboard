import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
// Fix for default marker icons in Leaflet with React
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

const MOCK_CAMERAS = [
  { id: 1, pos: [31.5204, 74.3587], status: "active", label: "Mall Road Cam 01" },
  { id: 2, pos: [31.5497, 74.3436], status: "active", label: "Gulberg Main Blvd" },
  { id: 3, pos: [31.4805, 74.2809], status: "alert", label: "Johar Town Intersection" },
  { id: 4, pos: [31.5600, 74.3100], status: "active", label: "Data Darbar Point" },
  { id: 5, pos: [31.5100, 74.3300], status: "offline", label: "Jail Road Entry" },
];

export function CityMap() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg" />;
  }

  // Lahore Coordinates
  const center = [31.5204, 74.3587] as [number, number];

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden border shadow-sm relative z-0">
      <MapContainer 
        center={center} 
        zoom={12} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {MOCK_CAMERAS.map((cam) => (
          <Circle 
            key={cam.id}
            center={cam.pos as [number, number]}
            radius={400}
            pathOptions={{ 
              color: cam.status === 'alert' ? '#ef4444' : cam.status === 'offline' ? '#64748b' : '#3b82f6',
              fillColor: cam.status === 'alert' ? '#ef4444' : cam.status === 'offline' ? '#64748b' : '#3b82f6',
              fillOpacity: 0.5,
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold font-heading">{cam.label}</h3>
                <p className="text-xs uppercase font-mono mt-1">Status: {cam.status}</p>
                <button className="mt-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded w-full">View Feed</button>
              </div>
            </Popup>
          </Circle>
        ))}
      </MapContainer>
      
      {/* Map Overlay Controls */}
      <div className="absolute top-4 right-4 z-[400] bg-card/90 backdrop-blur p-2 rounded-lg border shadow-lg flex flex-col gap-2">
         <div className="flex items-center gap-2 text-xs font-mono p-1">
           <div className="w-3 h-3 rounded-full bg-blue-500"></div> Active
         </div>
         <div className="flex items-center gap-2 text-xs font-mono p-1">
           <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div> Alert
         </div>
         <div className="flex items-center gap-2 text-xs font-mono p-1">
           <div className="w-3 h-3 rounded-full bg-slate-500"></div> Offline
         </div>
      </div>
    </div>
  );
}