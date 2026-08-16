import React from 'react';
import { Marker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Flame, Satellite } from 'lucide-react';

const createThermalIcon = (frp, brightness, confidence) => {
  const isHigh = frp > 25 || brightness > 345 || confidence === 'high';
  const color = isHigh ? '#ef4444' : '#f59e0b';
  const size = Math.min(24, Math.max(14, Math.round(frp / 2.5)));

  return L.divIcon({
    className: 'custom-firms-marker-icon',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; items-center; justify-content: center;">
        <div style="
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: radial-gradient(circle, ${color}99 0%, transparent 70%);
          animation: pulse-ring 1.8s infinite;
        "></div>
        <div style="
          width: 100%;
          height: 100%;
          background: ${color};
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 14px ${color}, 0 0 28px ${color}88;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

export default function FIRMSLayer({ hotspots, visible = true }) {
  if (!visible || !hotspots || hotspots.length === 0) return null;

  return (
    <>
      {hotspots.map((spot) => {
        const frp = spot.frp || 15;
        const brightness = spot.brightness || 335;
        const confidence = spot.confidence || 'nominal';

        return (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lng]}
            icon={createThermalIcon(frp, brightness, confidence)}
          >
            <Tooltip sticky>
              <div style={{ padding: '6px 8px', fontSize: '11px', color: '#fff', background: 'rgba(15, 23, 42, 0.95)', borderRadius: '6px' }}>
                <strong style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  🛰️ NASA FIRMS Thermal Anomaly
                </strong>
                <div style={{ marginTop: 4, lineHeight: 1.4 }}>
                  <div><strong>Power (FRP):</strong> {frp} MW</div>
                  <div><strong>Brightness:</strong> {brightness} K ({confidence} conf)</div>
                  <div><strong>Satellite:</strong> {spot.satellite || 'Suomi NPP'} · {spot.instrument || 'VIIRS'}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: 2 }}>{spot.acqDate} · {spot.acqTime} UTC</div>
                </div>
              </div>
            </Tooltip>

            <Popup>
              <div style={{ color: '#0f172a', padding: '6px', minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: '14px' }}>🔥</span>
                  <h4 style={{ margin: 0, fontSize: '13px', color: '#b45309', fontWeight: 800 }}>NASA Earthdata FIRMS Anomaly</h4>
                </div>
                <p style={{ margin: '4px 0', fontSize: '11px', lineHeight: 1.5, color: '#334155' }}>
                  <strong>Coordinates:</strong> {spot.lat.toFixed(4)}°, {spot.lng.toFixed(4)}°
                  <br />
                  <strong>Radiative Power:</strong> <span style={{ color: '#dc2626', fontWeight: 700 }}>{frp} MW</span>
                  <br />
                  <strong>Brightness Temp:</strong> {brightness} K
                  <br />
                  <strong>Satellite / Sensor:</strong> {spot.satellite || 'Suomi NPP'} ({spot.instrument || 'VIIRS'})
                  <br />
                  <strong>Detection Time:</strong> {spot.acqDate} {spot.acqTime} UTC
                </p>
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '6px 8px', borderRadius: 4, fontSize: '10px', color: '#92400e', marginTop: 6 }}>
                  🛰️ Correlates directly with ground-level biomass / stack emissions.
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
