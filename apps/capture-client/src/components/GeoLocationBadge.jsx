import React, { useState } from 'react';
import { MapPin, Navigation, Compass, RefreshCw, Crosshair } from 'lucide-react';

export default function GeoLocationBadge({ location, setLocation, weather, refreshWeather, t }) {
  const [isLocating, setIsLocating] = useState(false);

  const requestLiveGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setLocation({
          lat: Math.round(pos.coords.latitude * 10000) / 10000,
          lng: Math.round(pos.coords.longitude * 10000) / 10000,
          accuracy: Math.round(pos.coords.accuracy),
          isLiveGPS: true,
          status: 'locked'
        });
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation permission error:', err.message);
        alert(`Location permission note: ${err.message}. Using active scenario coordinates.`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const windDegrees = weather?.windDirection || 270;
  const windKmh = weather?.windSpeed || 14.5;
  const isLive = location?.isLiveGPS;

  return (
    <div className="telemetry-row">
      {/* GPS Location Pill with Interactive Live Lock */}
      <div 
        className="glass-card telemetry-card"
        onClick={requestLiveGPS}
        style={{ cursor: 'pointer', border: isLive ? '1px solid rgba(16, 185, 129, 0.6)' : '1px solid var(--border-color)' }}
        title="Click to request browser location and lock live physical GPS"
      >
        <div 
          className="telemetry-icon" 
          style={{ 
            background: isLive ? 'rgba(16, 185, 129, 0.18)' : 'rgba(56, 189, 248, 0.15)', 
            color: isLive ? '#10b981' : '#38bdf8' 
          }}
        >
          {isLocating ? <RefreshCw size={16} className="spin" /> : isLive ? <Crosshair size={18} /> : <MapPin size={18} />}
        </div>
        <div className="telemetry-info" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ color: isLive ? '#10b981' : 'var(--text-main)', fontSize: '0.78rem' }}>
              {isLive ? '🟢 Live Satellite GPS' : (t.locationLocked || 'GPS Lock')}
            </h4>
            {!isLive && <span style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 600 }}>Tap to Lock</span>}
          </div>
          <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
            {location.lat?.toFixed(4)}°, {location.lng?.toFixed(4)}°
          </p>
        </div>
      </div>

      {/* Real-time Open-Meteo Wind Vector Pill */}
      <div 
        className="glass-card telemetry-card"
        onClick={refreshWeather}
        style={{ cursor: 'pointer' }}
        title="Click to refresh live meteorological telemetry"
      >
        <div className="telemetry-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
          <Compass size={18} style={{ transform: `rotate(${windDegrees}deg)`, transition: 'transform 0.5s ease-out' }} />
        </div>
        <div className="telemetry-info" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ fontSize: '0.78rem' }}>{t.windTelemetry || 'Live Wind Vector'}</h4>
            <RefreshCw size={10} style={{ color: 'var(--text-dim)' }} />
          </div>
          <p className="mono" style={{ fontSize: '0.8rem', color: '#7dd3fc' }}>
            {windKmh} km/h · {windDegrees}°
          </p>
        </div>
      </div>
    </div>
  );
}
