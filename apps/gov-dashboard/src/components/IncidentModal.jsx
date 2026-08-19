import React from 'react';
import { X, AlertTriangle, ShieldAlert, Wind, Thermometer, Droplets, Compass, CheckCircle2, Send, Activity, FileText } from 'lucide-react';

export default function IncidentModal({
  incident,
  onClose,
  onOpenDispatch,
  onOpenDossier,
  onBroadcastAdvisory,
  t
}) {
  if (!incident) return null;

  const ai = incident.aiResult || {};
  const weather = incident.weather || {};
  const plume = ai.plume_vector || {};
  const isHazard = ai.immediate_health_hazard;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isHazard ? (
              <div style={{ background: 'rgba(244, 63, 94, 0.2)', padding: 6, borderRadius: 8, color: '#fb7185' }}>
                <AlertTriangle size={20} />
              </div>
            ) : (
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: 6, borderRadius: 8, color: '#34d399' }}>
                <CheckCircle2 size={20} />
              </div>
            )}
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                {incident.title}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Incident ID: <span className="mono">{incident.id}</span> · {incident.region} ({incident.country})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Top grid: Image & Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
            <div style={{ borderRadius: 8, overflow: 'hidden', height: 220, border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
              <img
                src={incident.imageUrl}
                alt="Incident Capture"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: 4, fontSize: '0.7rem', color: '#fff' }}>
                📍 {incident.lat?.toFixed(4)}°, {incident.lng?.toFixed(4)}°
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Density Card */}
              <div className="glass-card" style={{ padding: 12 }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Visual Density Score</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                  <span className="mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: ai.visual_density_score > 7.5 ? '#fb7185' : '#38bdf8' }}>
                    {ai.visual_density_score || 7.0}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ 10</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#cbd5e1', marginTop: 4 }}>
                  Opacity Model: ISO 14064 Optical Transmittance
                </div>
              </div>

              {/* Plume Dynamics Card */}
              <div className="glass-card" style={{ padding: 12 }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Plume Drift Dynamics</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <Wind size={18} color="#10b981" />
                  <span className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                    {plume.estimated_drift_km_per_hr || 16.5} km/h
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    towards {plume.direction_degrees || 90}°
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: 4 }}>
                  Est. Length: {plume.estimated_plume_length_km || 12.0} km
                </div>
              </div>
            </div>
          </div>

          {/* Meteorological Telemetry Row */}
          <div className="glass-card" style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Wind Speed</span>
              <p className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>
                {weather.windSpeed || 14.5} km/h
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Wind Direction</span>
              <p className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>
                {weather.windDirection || 270}°
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Temperature</span>
              <p className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>
                {weather.temperature || 28}°C
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Humidity</span>
              <p className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>
                {weather.humidity || 50}%
              </p>
            </div>
          </div>

          {/* Detected Pollutants */}
          {ai.pollutants_detected?.length > 0 && (
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1' }}>Detected Hazardous Compounds:</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {ai.pollutants_detected.map((p, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#7dd3fc',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cross-border risk banner */}
          {plume.cross_border_risk && (
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', padding: 12, borderRadius: 8, color: '#fcd34d', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldAlert size={20} />
              <div>
                <strong>Cross-Border Dispersion Warning:</strong> This emission plume will impact adjacent regional/national air sheds.
                {plume.affected_jurisdictions && (
                  <div style={{ marginTop: 4, color: '#fff', fontSize: '0.75rem' }}>
                    Impacted Jurisdictions: {plume.affected_jurisdictions.join(' ⇄ ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Forensic Advice */}
          <div style={{ background: 'rgba(15, 23, 42, 0.9)', padding: 14, borderRadius: 8, borderLeft: '3px solid #38bdf8' }}>
            <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
              Gemini Vision AI Forensic Summary & Dispatch Protocol:
            </span>
            <p style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: 6, lineHeight: 1.45 }}>
              {ai.dispatch_recommendation}
            </p>
          </div>

          {/* Citizen Note */}
          {incident.voiceNote && (
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 6 }}>
              🗣️ Citizen Voice Observation: "{incident.voiceNote}"
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(9, 13, 22, 0.8)', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Origin: <strong style={{ color: incident.source_platform?.startsWith('flutter') ? '#38bdf8' : '#cbd5e1' }}>{incident.source_platform?.startsWith('flutter') ? '📱 Native Mobile App (Flutter)' : '🌐 Citizen Web PWA'}</strong> · Engine: {ai.ai_model || 'Google Gemini Vision'}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {onOpenDossier && (
              <button
                onClick={() => onOpenDossier(incident)}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#38bdf8',
                  padding: '8px 14px',
                  borderRadius: 6,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <FileText size={15} />
                <span>Legal Dossier (PDF)</span>
              </button>
            )}

            {onBroadcastAdvisory && (
              <button
                onClick={() => onBroadcastAdvisory(incident)}
                style={{
                  background: 'rgba(245, 158, 11, 0.18)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#fcd34d',
                  padding: '8px 14px',
                  borderRadius: 6,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Activity size={15} />
                <span>📢 Health Advisory</span>
              </button>
            )}

            <button
              className="btn-dispatch"
              onClick={() => onOpenDispatch(incident)}
            >
              <Send size={16} />
              <span>{t.dispatchAlert}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
