import React from 'react';
import { Polygon, Polyline, Tooltip, Popup } from 'react-leaflet';
import { generatePlumeFootprint } from '../lib/plumeModel';

export default function PlumeLayer({
  reports,
  selectedIncident,
  visible = true,
  forecastOffsetHours = 0,
  forecastData = null
}) {
  if (!visible) return null;

  return (
    <>
      {reports.map((report) => {
        if (!report.lat || !report.lng) return null;

        const weather = report.weather || {};
        const aiResult = report.aiResult || {};
        const isHazard = aiResult.immediate_health_hazard;
        const density = aiResult.visual_density_score || 7.0;
        const isSelected = selectedIncident?.id === report.id;

        // Base wind parameters
        let activeWindSpeed = weather.windSpeed || 15;
        let activeWindDirection = weather.windDirection || 270;

        // Apply forecast offset if active
        if (forecastOffsetHours > 0) {
          if (forecastData && forecastData.length > 0) {
            const matchingForecast = forecastData.find(f => f.hoursAhead === forecastOffsetHours) || forecastData[forecastData.length - 1];
            if (matchingForecast) {
              activeWindSpeed = matchingForecast.windSpeed;
              activeWindDirection = matchingForecast.windDirection;
            }
          } else {
            // Dynamic meteorological drift rotation model
            activeWindDirection = Math.round((activeWindDirection + forecastOffsetHours * 4.2) % 360);
            activeWindSpeed = Math.max(8, Math.round((activeWindSpeed + Math.sin(forecastOffsetHours / 3) * 5) * 10) / 10);
          }
        }

        const footprint = generatePlumeFootprint({
          lat: report.lat,
          lng: report.lng,
          windSpeed: activeWindSpeed,
          windDirection: activeWindDirection,
          visualDensity: density
        });

        // Polygon coloring: Rose/Red for high hazard, Amber/Orange for medium
        const outerColor = isHazard ? '#f43f5e' : '#f59e0b';
        const coreColor = isHazard ? '#be123c' : '#d97706';

        return (
          <React.Fragment key={`plume_${report.id}_${forecastOffsetHours}`}>
            {/* Outer Dispersion Footprint (~95% concentration boundary) */}
            <Polygon
              positions={footprint.plumePolygon}
              pathOptions={{
                color: outerColor,
                weight: isSelected ? 2 : 1,
                fillColor: outerColor,
                fillOpacity: isSelected ? 0.38 : 0.24,
                dashArray: isHazard ? '4, 4' : null
              }}
            >
              <Tooltip sticky>
                <div style={{ padding: '2px 4px', fontSize: '11px', lineHeight: 1.45 }}>
                  <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: 2 }}>
                    {report.title} {forecastOffsetHours > 0 && <span style={{ color: '#fcd34d', fontSize: '10px' }}>(+{forecastOffsetHours}h Forecast)</span>}
                  </div>
                  <div>Reach: <strong>{footprint.lengthKm} km</strong> · Bearing: <strong>{footprint.bearing}°</strong></div>
                  <div>Wind: <strong>{activeWindSpeed} km/h @ {activeWindDirection}°</strong></div>
                  <div style={{ marginTop: 2, color: aiResult.plume_vector?.cross_border_risk ? '#fb7185' : '#34d399', fontWeight: 600 }}>
                    Cross-Border Risk: {aiResult.plume_vector?.cross_border_risk ? '⚠️ CRITICAL' : '✓ LOCALIZED'}
                  </div>
                </div>
              </Tooltip>
            </Polygon>

            {/* High Concentration Core Zone */}
            <Polygon
              positions={footprint.corePolygon}
              pathOptions={{
                color: coreColor,
                weight: 1.5,
                fillColor: coreColor,
                fillOpacity: isSelected ? 0.6 : 0.45
              }}
            />

            {/* Centerline Wind Vector Line */}
            <Polyline
              positions={footprint.vectorLine}
              pathOptions={{
                color: '#38bdf8',
                weight: 2,
                dashArray: '5, 5',
                opacity: 0.85
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
}
