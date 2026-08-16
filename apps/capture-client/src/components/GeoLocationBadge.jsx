import React, { useEffect } from 'react';
import { MapPin, Navigation, Compass } from 'lucide-react';

export default function GeoLocationBadge({ location, setLocation, weather, t }) {
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation((prev) => ({
          ...prev,
          lat: Math.round(pos.coords.latitude * 10000) / 10000,
          lng: Math.round(pos.coords.longitude * 10000) / 10000,
          accuracy: Math.round(pos.coords.accuracy),
          status: 'locked'
        }));
      },
      (err) => {
        console.warn('Geolocation denied/unavailable, keeping calibrated location:', err.message);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );

    return () => {};
  }, [setLocation]);

  const windDegrees = weather?.windDirection || 270;
  const windKmh = weather?.windSpeed || 14.5;

  return (
    <div className="telemetry-row">
      <div className="glass-card telemetry-card">
        <div className="telemetry-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
          <MapPin size={18} />
        </div>
        <div className="telemetry-info">
          <h4>{t.locationLocked}</h4>
          <p className="mono" style={{ fontSize: '0.8rem' }}>
            {location.lat?.toFixed(3)}°, {location.lng?.toFixed(3)}°
          </p>
        </div>
      </div>

      <div className="glass-card telemetry-card">
        <div className="telemetry-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
          <Compass size={18} style={{ transform: `rotate(${windDegrees}deg)`, transition: 'transform 0.5s' }} />
        </div>
        <div className="telemetry-info">
          <h4>{t.windTelemetry}</h4>
          <p className="mono" style={{ fontSize: '0.8rem' }}>
            {windKmh} km/h · {windDegrees}°
          </p>
        </div>
      </div>
    </div>
  );
}
