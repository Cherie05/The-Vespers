import React from 'react';
import { AlertTriangle, CheckCircle2, Wind, ShieldAlert, ArrowRight, Activity, Award } from 'lucide-react';

export default function SubmissionStatus({ status, result, errorMessage, t }) {
  if (status === 'idle') return null;

  if (status === 'loading') {
    return (
      <div className="glass-panel" style={{ padding: 20, textAlign: 'center', marginTop: 16 }}>
        <div style={{ display: 'inline-block', position: 'relative', marginBottom: 12 }}>
          <Activity size={36} color="#38bdf8" style={{ animation: 'spin 2s linear infinite' }} />
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>
          {t.analyzing}
        </h3>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <p>1. Querying live Open-Meteo wind vector</p>
          <p>2. Multimodal Google Gemini 3.5 Flash forensic classification</p>
          <p>3. Computing Gaussian plume dispersion footprint</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="glass-panel" style={{ padding: 20, textAlign: 'center', marginTop: 16, border: '1px solid rgba(244, 63, 94, 0.4)', background: 'rgba(244, 63, 94, 0.1)' }}>
        <div style={{ display: 'inline-block', marginBottom: 10 }}>
          <AlertTriangle size={36} color="#fb7185" />
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>
          Analysis Request Failed
        </h3>
        <p style={{ fontSize: '0.82rem', color: '#fca5a5', lineHeight: 1.5 }}>
          {errorMessage || 'Unable to complete Google Gemini AI analysis. Please verify your connection or photo format.'}
        </p>
      </div>
    );
  }

  if (status === 'success' && result) {
    const isHazard = result.aiResult?.immediate_health_hazard;
    const density = result.aiResult?.visual_density_score || 7.0;
    const plume = result.aiResult?.plume_vector;

    return (
      <div className={`glass-panel result-card ${isHazard ? 'hazard' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {isHazard ? (
            <div className="hazard-badge">
              <AlertTriangle size={14} />
              {t.hazardAlert}
            </div>
          ) : (
            <div className="hazard-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
              <CheckCircle2 size={14} />
              {t.safeAlert}
            </div>
          )}

          <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {result.id}
          </span>
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: '4px 0 8px' }}>
          {result.aiResult?.source_classification}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '12px 0' }}>
          <div className="glass-card" style={{ padding: '10px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t.densityScore}
            </span>
            <p className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: density > 7 ? '#fb7185' : '#38bdf8' }}>
              {density}/10
            </p>
          </div>

          <div className="glass-card" style={{ padding: '10px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t.plumeDrift}
            </span>
            <p className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Wind size={16} />
              {plume?.direction_degrees}° · {plume?.estimated_drift_km_per_hr} km/h
            </p>
          </div>
        </div>

        {result.aiResult?.pollutants_detected?.length > 0 && (
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Detected Compounds:</span>
            <div className="pollutants-list">
              {result.aiResult.pollutants_detected.map((p, idx) => (
                <span key={idx} className="pollutant-chip">{p}</span>
              ))}
            </div>
          </div>
        )}

        {plume?.cross_border_risk && (
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '8px 10px', borderRadius: 8, margin: '10px 0', fontSize: '0.8rem', color: '#fcd34d', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldAlert size={16} />
            <span><strong>Cross-Border Alert:</strong> Plume projected to cross jurisdictional boundaries within 90 minutes.</span>
          </div>
        )}

        {result.aiResult?.category_discrepancy_detected && (
          <div style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '8px 10px', borderRadius: 8, margin: '10px 0', fontSize: '0.78rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={16} />
            <span><strong>Optical Auto-Correction:</strong> Gemini Vision identified <em>{result.aiResult?.source_classification}</em> from image pixels with {Math.round((result.aiResult?.confidence_score || 0.95) * 100)}% confidence.</span>
          </div>
        )}

        <div style={{ marginTop: 10, padding: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
            {t.dispatchAdvice}:
          </p>
          <p style={{ fontSize: '0.82rem', color: '#e2e8f0', marginTop: 4, lineHeight: 1.4 }}>
            {result.aiResult?.dispatch_recommendation}
          </p>
        </div>

        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
          <span>AI Engine: {result.aiResult?.ai_model || 'Gemini 3.6 Flash'}</span>
          <span style={{ color: '#10b981', fontWeight: 700 }}>
            🛡️ {result.aiResult?.authenticity_score || 94}% Authenticity Score
          </span>
        </div>
      </div>
    );
  }

  return null;
}
