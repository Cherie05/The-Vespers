import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Eye, Wind, Satellite, Flame, Layers } from 'lucide-react';
import PlumeLayer from './PlumeLayer';
import FIRMSLayer from './FIRMSLayer';
import HeatmapLayer from './HeatmapLayer';

// Custom DivIcons for incident pins
const createIncidentIcon = (isHazard, isDispatched) => {
  const color = isDispatched ? '#10b981' : isHazard ? '#ef4444' : '#f59e0b';
  return L.divIcon({
    className: 'custom-incident-pin',
    html: `<div style="
      width: 22px;
      height: 22px;
      background: ${color};
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 14px ${color};
      cursor: pointer;
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

// Component to handle smooth viewport pan and zoom
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2) {
      map.flyTo(center, zoom || 10, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapView({
  reports,
  hotspots,
  selectedIncident,
  onSelectIncident,
  onOpenModal,
  onQuickDispatch,
  currentRegion,
  layers,
  setLayers,
  t
}) {
  const mapCenter = selectedIncident
    ? [selectedIncident.lat, selectedIncident.lng]
    : [currentRegion.lat, currentRegion.lng];

  return (
    <div className="map-container-wrap">
      {/* Floating Layer Controls */}
      <div className="map-floating-controls">
        <button
          className={`layer-toggle-btn ${layers.pins ? 'active' : ''}`}
          onClick={() => setLayers((prev) => ({ ...prev, pins: !prev.pins }))}
        >
          <Eye size={14} />
          <span>{t.citizenPins}</span>
        </button>

        <button
          className={`layer-toggle-btn ${layers.plume ? 'active' : ''}`}
          onClick={() => setLayers((prev) => ({ ...prev, plume: !prev.plume }))}
        >
          <Wind size={14} />
          <span>{t.plumeVectors}</span>
        </button>

        <button
          className={`layer-toggle-btn ${layers.firms ? 'active' : ''}`}
          onClick={() => setLayers((prev) => ({ ...prev, firms: !prev.firms }))}
        >
          <Satellite size={14} />
          <span>{t.firmsLayer} ({hotspots.length})</span>
        </button>

        <button
          className={`layer-toggle-btn ${layers.heatmap ? 'active' : ''}`}
          onClick={() => setLayers((prev) => ({ ...prev, heatmap: !prev.heatmap }))}
        >
          <Flame size={14} />
          <span>{t.heatmapLayer}</span>
        </button>
      </div>

      {/* NASA Satellite Overlay Status HUD */}
      {layers.firms && hotspots.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          zIndex: 998,
          background: 'rgba(15, 23, 42, 0.88)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          padding: '8px 14px',
          borderRadius: '10px',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#fff',
          fontSize: '0.78rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', animation: 'pulse-ring 1.8s infinite' }}></div>
          <div>
            <span style={{ color: '#f59e0b', fontWeight: 700 }}>NASA VIIRS / MODIS:</span>{' '}
            <span className="mono" style={{ fontWeight: 800 }}>{hotspots.length} Active Thermal Anomalies</span> in {currentRegion.name}
          </div>
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={currentRegion.zoom || 10}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <MapController center={mapCenter} zoom={selectedIncident ? 12 : currentRegion.zoom} />

        {/* CartoDB Dark Matter base tile */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> | &copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Multi-report Clustering Heatmap */}
        <HeatmapLayer reports={reports} visible={layers.heatmap} />

        {/* Gaussian Plume Dispersion Fan Layer */}
        <PlumeLayer reports={reports} selectedIncident={selectedIncident} visible={layers.plume} />

        {/* NASA FIRMS Satellite Thermal Anomaly Overlay */}
        <FIRMSLayer hotspots={hotspots} visible={layers.firms} />

        {/* Citizen Incident Nodes */}
        {layers.pins &&
          reports.map((report) => {
            const isHazard = report.aiResult?.immediate_health_hazard;
            const isDispatched = report.status === 'dispatched';
            const density = report.aiResult?.visual_density_score || 7.0;

            return (
              <Marker
                key={report.id}
                position={[report.lat, report.lng]}
                icon={createIncidentIcon(isHazard, isDispatched)}
                eventHandlers={{
                  click: () => onSelectIncident(report)
                }}
              >
                <Tooltip direction="top" offset={[0, -12]}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
                    {report.title}
                  </div>
                </Tooltip>

                <Popup>
                  <div style={{ minWidth: 230, padding: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>{report.region}</span>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 4,
                        background: isDispatched ? 'rgba(16, 185, 129, 0.2)' : 'rgba(225, 29, 72, 0.2)',
                        color: isDispatched ? '#34d399' : '#fb7185'
                      }}>
                        {isDispatched ? 'DISPATCHED' : 'ACTIVE'}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
                      {report.title}
                    </h4>

                    {report.imageUrl && (
                      <div style={{ width: '100%', height: 90, borderRadius: 6, overflow: 'hidden', marginBottom: 6 }}>
                        <img src={report.imageUrl} alt="Incident" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

                    <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4, marginBottom: 8 }}>
                      <div><strong>Density:</strong> {density}/10</div>
                      <div><strong>Plume Vector:</strong> {report.weather?.windSpeed || 15} km/h @ {report.weather?.windDirection || 270}°</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <button
                        onClick={() => onQuickDispatch && onQuickDispatch(report)}
                        disabled={isDispatched}
                        style={{
                          background: isDispatched ? 'rgba(16, 185, 129, 0.18)' : 'linear-gradient(135deg, #e11d48, #be123c)',
                          border: isDispatched ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
                          color: '#fff',
                          padding: '6px 8px',
                          borderRadius: 4,
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: isDispatched ? 'default' : 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        {isDispatched ? '✓ Dispatched' : '⚡ Dispatch Alert'}
                      </button>

                      <button
                        onClick={() => onOpenModal && onOpenModal(report)}
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          color: '#38bdf8',
                          padding: '6px 8px',
                          borderRadius: 4,
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        🔍 Forensics
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
