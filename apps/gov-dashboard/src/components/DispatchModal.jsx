import React, { useState } from 'react';
import { X, Send, ShieldCheck, CheckCircle2, Radio, Globe, FileCheck } from 'lucide-react';

export default function DispatchModal({ incident, onClose, onConfirmDispatch, t }) {
  const [targetAgency, setTargetAgency] = useState('ALL_RELEVANT');
  const [dispatchStatus, setDispatchStatus] = useState('idle'); // idle | sending | sent

  if (!incident) return null;

  const ai = incident.aiResult || {};
  const plume = ai.plume_vector || {};

  const handleSend = () => {
    setDispatchStatus('sending');
    setTimeout(() => {
      onConfirmDispatch(incident.id, targetAgency);
      setDispatchStatus('sent');
      setTimeout(() => {
        onClose();
      }, 1800);
    }, 1200);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Radio size={20} color="#e11d48" style={{ animation: 'pulse 1.5s infinite' }} />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                Inter-Agency Dispatch & Cross-Border Telemetry Broadcast
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Protocol: BRICS-AERO-FED-v1.0 · Secured Environmental Grid
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {dispatchStatus === 'sent' ? (
            <div style={{ padding: '30px 20px', textAlign: 'center' }}>
              <CheckCircle2 size={48} color="#10b981" style={{ marginBottom: 12 }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                Dispatch Broadcast Confirmed & Transmitted!
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 6 }}>
                Joint environmental response units and cross-border liaison offices have received the telemetry bundle.
              </p>
            </div>
          ) : (
            <>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Standardized Dispatch Payload</span>
                <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>
                  {incident.title}
                </p>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: 4, lineHeight: 1.4 }}>
                  <strong>Source:</strong> {ai.source_classification} (Density: {ai.visual_density_score}/10)
                  <br />
                  <strong>Plume Velocity:</strong> {plume.estimated_drift_km_per_hr} km/h towards {plume.direction_degrees}°
                  <br />
                  <strong>Coordinates:</strong> {incident.lat}°, {incident.lng}° ({incident.region})
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
                  Target Environmental Protection Authorities:
                </label>
                <select
                  value={targetAgency}
                  onChange={(e) => setTargetAgency(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: 6,
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value="ALL_RELEVANT">⚡ Unified BRICS Cross-Border Air Command (All Affected)</option>
                  <option value="CPCB_IN">Central Pollution Control Board (CPCB / State Boards)</option>
                  <option value="PUNJAB_EPA">Punjab Environment Protection Department (Trans-boundary Alert)</option>
                  <option value="IBAMA_BR">IBAMA & Prevfogo Forest Fire Protection (Brazil)</option>
                  <option value="DARDLEA_ZA">Mpumalanga Environmental Inspectorate (South Africa)</option>
                  <option value="SHANGHAI_EEB">Shanghai Ecology and Environment Bureau (China)</option>
                </select>
              </div>

              <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: 10, borderRadius: 6, fontSize: '0.75rem', color: '#7dd3fc', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileCheck size={16} />
                <span>Payload auto-includes Gaussian plume vector polygon coordinates and NASA FIRMS satellite ground truthing.</span>
              </div>
            </>
          )}
        </div>

        {dispatchStatus !== 'sent' && (
          <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'rgba(9, 13, 22, 0.8)' }}>
            <button
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: '0.82rem', cursor: 'pointer' }}
            >
              Cancel
            </button>

            <button
              className="btn-dispatch"
              onClick={handleSend}
              disabled={dispatchStatus === 'sending'}
            >
              <Send size={16} />
              <span>{dispatchStatus === 'sending' ? 'Transmitting Alert...' : 'Authorize & Broadcast Alert'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
