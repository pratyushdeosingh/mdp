import { useEffect, useMemo, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppContext } from '../context/AppContext';
import GlassCard from '../components/GlassCard';
import { MapPin, Navigation, Gauge } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Custom marker icon — created once at module scope
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

const LiveMap = memo(function LiveMap() {
  const { sensorData, sensorHistory } = useAppContext();

  // Trail from history — memoized to avoid recalculating on every render
  // Must be called before any early returns to satisfy rules of hooks
  const trail = useMemo<[number, number][]>(
    () => sensorHistory.map(d => [d.gps.latitude, d.gps.longitude]),
    [sensorHistory]
  );

  if (!sensorData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)]">Acquiring GPS coordinates…</p>
      </div>
    );
  }

  const { latitude, longitude, speed } = sensorData.gps;

  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Live Map View</h1>
          <p className="text-sm text-[var(--text-muted)]">Real-time GPS position tracking with trail history</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full pulse-live" style={{ background: 'var(--color-emerald)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--color-emerald)' }}>Live Tracking</span>
        </div>
      </div>

      {/* Map */}
      <GlassCard className="p-0 overflow-hidden" style={{ height: 'min(500px, 65vh)' }}>
        <MapContainer
          center={[latitude, longitude]}
          zoom={15}
          style={{ height: '100%', width: '100%', borderRadius: '16px' }}
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
          <MapPin size={20} style={{ color: 'var(--color-blue)' }} />
          <div>
            <p className="text-xs text-[var(--text-muted)]">Latitude</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">{latitude}</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3 p-4">
          <Navigation size={20} style={{ color: 'var(--color-cyan)' }} />
          <div>
            <p className="text-xs text-[var(--text-muted)]">Longitude</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">{longitude}</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3 p-4">
          <Gauge size={20} style={{ color: 'var(--color-emerald)' }} />
          <div>
            <p className="text-xs text-[var(--text-muted)]">Current Speed</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">{speed} km/h</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
});

export default LiveMap;
