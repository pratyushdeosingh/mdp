import { useEffect, useMemo, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppContext } from '../context/AppContext';
import GlassCard from '../components/GlassCard';
import { MapPin, Navigation, Gauge } from 'lucide-react';

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
  
  // Fix Leaflet rendering issue when container size isn't known at mount
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true, duration: 0.5 });
  }, [lat, lng, map]);
  return null;
}

const LiveMap = memo(function LiveMap() {
  const { sensorData, sensorHistory } = useAppContext();

  // Trail from history — memoized to avoid recalculating on every render
  // Filter out entries with null coordinates
  const trail = useMemo<[number, number][]>(
    () => sensorHistory
      .filter(d => d.gps.latitude !== null && d.gps.longitude !== null)
      .map(d => [d.gps.latitude as number, d.gps.longitude as number]),
    [sensorHistory]
  );

  if (!sensorData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)]">Acquiring GPS coordinates…</p>
      </div>
    );
  }

  const latitude = sensorData.gps.latitude ?? 0;
  const longitude = sensorData.gps.longitude ?? 0;
  const speed = sensorData.gps.speed ?? 0;

  return (
    <div className="w-full min-h-[calc(100vh-120px)] flex flex-col gap-4">
      {/* Header */}
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

      {/* Main content - two column layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* Map - takes 3/4 on large screens, full height */}
        <GlassCard className="lg:col-span-3 p-0 overflow-hidden min-h-[400px] lg:min-h-0">
          <MapContainer
            center={[latitude, longitude]}
            zoom={15}
            style={{ height: '100%', width: '100%', borderRadius: '16px', minHeight: '400px' }}
            zoomControl={true}
            scrollWheelZoom={true}
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

        {/* Stats sidebar - 1/4 on large screens */}
        <div className="flex flex-col gap-4">
          <GlassCard className="flex items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
              <MapPin size={24} style={{ color: 'var(--color-blue)' }} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-[var(--text-muted)] mb-1">Latitude</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{latitude.toFixed(6)}</p>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>
              <Navigation size={24} style={{ color: 'var(--color-cyan)' }} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-[var(--text-muted)] mb-1">Longitude</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{longitude.toFixed(6)}</p>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
              <Gauge size={24} style={{ color: 'var(--color-emerald)' }} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-[var(--text-muted)] mb-1">Current Speed</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{speed} <span className="text-sm font-normal text-[var(--text-muted)]">km/h</span></p>
            </div>
          </GlassCard>

          {/* Trail info */}
          <GlassCard className="flex-1 flex flex-col gap-3 p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Trail History</h3>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: '#3b82f6' }} />
              <span className="text-sm text-[var(--text-muted)]">{trail.length} waypoints</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              The blue dashed line shows the vehicle's movement path over time.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
});

export default LiveMap;
