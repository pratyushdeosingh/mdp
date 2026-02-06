import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppContext } from '../context/AppContext';
import GlassCard from '../components/GlassCard';
import { MapPin, Navigation, Gauge } from 'lucide-react';

// Custom marker icon
const markerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true, duration: 0.5 });
  }, [lat, lng, map]);
  return null;
}

export default function LiveMap() {
  const { sensorData, sensorHistory } = useAppContext();
  const mapRef = useRef<L.Map | null>(null);

  if (!sensorData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)]">Waiting for GPS data...</p>
      </div>
    );
  }

  const { latitude, longitude, speed } = sensorData.gps;

  // Trail from history
  const trail: [number, number][] = sensorHistory.map(d => [d.gps.latitude, d.gps.longitude]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Live Map View</h1>
          <p className="text-sm text-[var(--text-muted)]">Real-time GPS position tracking with trail history</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-live" />
          <span className="text-xs text-emerald-400 font-medium">Live Tracking</span>
        </div>
      </div>

      {/* Map */}
      <GlassCard className="p-0 overflow-hidden" style={{ height: '500px' }}>
        <MapContainer
          center={[latitude, longitude]}
          zoom={15}
          style={{ height: '100%', width: '100%', borderRadius: '16px' }}
          ref={mapRef}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater lat={latitude} lng={longitude} />
          <Marker position={[latitude, longitude]} icon={markerIcon}>
            <Popup>
              <div className="text-sm">
                <strong>Vehicle Position</strong><br />
                Lat: {latitude}<br />
                Lng: {longitude}<br />
                Speed: {speed} km/h
              </div>
            </Popup>
          </Marker>
          {trail.length > 1 && (
            <Polyline
              positions={trail}
              pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.6, dashArray: '8 4' }}
            />
          )}
        </MapContainer>
      </GlassCard>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="flex items-center gap-3 p-4">
          <MapPin size={20} className="text-blue-400" />
          <div>
            <p className="text-xs text-[var(--text-muted)]">Latitude</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">{latitude}</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3 p-4">
          <Navigation size={20} className="text-cyan-400" />
          <div>
            <p className="text-xs text-[var(--text-muted)]">Longitude</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">{longitude}</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3 p-4">
          <Gauge size={20} className="text-emerald-400" />
          <div>
            <p className="text-xs text-[var(--text-muted)]">Current Speed</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">{speed} km/h</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
