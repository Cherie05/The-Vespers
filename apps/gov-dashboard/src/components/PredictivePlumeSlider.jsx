import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Wind, AlertTriangle, Sparkles } from 'lucide-react';

const TIME_STEPS = [
  { hours: 0, label: 'NOW' },
  { hours: 3, label: '+3h' },
  { hours: 6, label: '+6h' },
  { hours: 12, label: '+12h' },
  { hours: 18, label: '+18h' },
  { hours: 24, label: '+24h' }
];

export default function PredictivePlumeSlider({
  forecastOffsetHours,
  setForecastOffsetHours,
  forecastData = [],
  currentRegion
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setForecastOffsetHours((prev) => {
          const currentIndex = TIME_STEPS.findIndex((s) => s.hours === prev);
          const nextIndex = (currentIndex + 1) % TIME_STEPS.length;
          return TIME_STEPS[nextIndex].hours;
        });
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [isPlaying, setForecastOffsetHours]);

  const activeForecast = forecastData.find((f) => f.hoursAhead === forecastOffsetHours) || {
    windSpeed: 15.0 + (forecastOffsetHours > 0 ? 3.5 : 0),
    windDirection: (270 + forecastOffsetHours * 4.2) % 360,
    temperature: 28.0,
    humidity: 50
  };

  return (
    <div
      className="predictive-plume-card"
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(10, 15, 26, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: 12,
        padding: '10px 16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 15px rgba(56, 189, 248, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        minWidth: 480,
        maxWidth: '90vw'
      }}
    >
      {/* Play / Pause / Reset Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            background: isPlaying ? 'rgba(244, 63, 94, 0.2)' : 'rgba(56, 189, 248, 0.2)',
            border: isPlaying ? '1px solid #f43f5e' : '1px solid #38bdf8',
            color: isPlaying ? '#fb7185' : '#38bdf8',
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          title={isPlaying ? 'Pause Simulation' : 'Play 24h Plume Progression'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 2 }} />}
        </button>

        {forecastOffsetHours > 0 && (
          <button
            onClick={() => {
              setIsPlaying(false);
              setForecastOffsetHours(0);
            }}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#94a3b8',
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Reset to Live Telemetry"
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>

      {/* Time Step Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
        {TIME_STEPS.map((step) => {
          const isActive = forecastOffsetHours === step.hours;
          return (
            <button
              key={step.hours}
              onClick={() => {
                setIsPlaying(false);
                setForecastOffsetHours(step.hours);
              }}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: 6,
                fontSize: '0.74rem',
                fontWeight: isActive ? 800 : 600,
                background: isActive
                  ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(2, 132, 199, 0.4))'
                  : 'rgba(255, 255, 255, 0.04)',
                color: isActive ? '#38bdf8' : '#94a3b8',
                border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'center'
              }}
            >
              {step.label}
            </button>
          );
        })}
      </div>

      {/* Live Simulation Info Pill */}
      <div
        style={{
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          paddingLeft: 12,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 150
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: '#38bdf8', fontWeight: 700 }}>
          <Clock size={11} />
          <span>{forecastOffsetHours === 0 ? 'LIVE ADVECTION' : `PREDICTIVE (+${forecastOffsetHours}H)`}</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: '#e2e8f0', fontWeight: 600, marginTop: 1 }}>
          <span style={{ color: '#cbd5e1' }}>Wind: </span>
          <span className="mono" style={{ color: '#fcd34d' }}>
            {activeForecast.windSpeed} km/h @ {Math.round(activeForecast.windDirection)}°
          </span>
        </div>
      </div>
    </div>
  );
}
