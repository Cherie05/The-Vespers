import React from 'react';
import { Circle } from 'react-leaflet';

export default function HeatmapLayer({ reports, visible = true }) {
  if (!visible || !reports || reports.length === 0) return null;

  return (
    <>
      {reports.map((r) => {
        if (!r.lat || !r.lng) return null;
        const density = r.aiResult?.visual_density_score || 7.0;
        const radiusMeters = Math.max(3000, density * 1200);

        return (
          <React.Fragment key={`heat_${r.id}`}>
            {/* Outer halo */}
            <Circle
              center={[r.lat, r.lng]}
              radius={radiusMeters}
              pathOptions={{
                stroke: false,
                fillColor: '#8b5cf6',
                fillOpacity: 0.15
              }}
            />
            {/* Mid intensity */}
            <Circle
              center={[r.lat, r.lng]}
              radius={radiusMeters * 0.55}
              pathOptions={{
                stroke: false,
                fillColor: '#ec4899',
                fillOpacity: 0.25
              }}
            />
            {/* Hotspot Core */}
            <Circle
              center={[r.lat, r.lng]}
              radius={radiusMeters * 0.25}
              pathOptions={{
                stroke: false,
                fillColor: '#f43f5e',
                fillOpacity: 0.45
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
}
