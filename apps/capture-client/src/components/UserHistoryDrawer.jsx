import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Wind,
  RefreshCw,
  Clock,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Trash2,
  FileText
} from 'lucide-react';
import { getReports, getDeviceUUID, saveReport, clearReports } from '../lib/historyStorage';

export default function UserHistoryDrawer({ isOpen, onClose, apiBase, onSelectReport }) {
  const [reports, setReports] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const deviceId = getDeviceUUID();

  // Load from local storage whenever drawer opens
  useEffect(() => {
    if (isOpen) {
      loadLocalHistory();
      syncWithServer();
    }
  }, [isOpen]);

  const loadLocalHistory = () => {
    const local = getReports();
    setReports(local);
  };

  // Optionally query backend for updated statuses for this device
  const syncWithServer = async () => {
    if (!apiBase) return;
    try {
      setIsRefreshing(true);
      const res = await fetch(`${apiBase}/api/reports/history?deviceId=${encodeURIComponent(deviceId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          // Merge / update any status changes from server into local storage
          json.data.forEach((serverReport) => {
            saveReport(serverReport);
          });
          setReports(getReports());
        }
      }
    } catch (err) {
      console.warn('[UserHistoryDrawer] Could not sync with backend history:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your local submission history receipts?')) {
      clearReports();
      setReports([]);
      setSelectedReceipt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 540,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          border: '1px solid var(--border-glow)',
          borderBottom: 'none',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          background: 'rgba(10, 16, 30, 0.97)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.8)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)'
              }}
            >
              <History size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.2px' }}>
                My Submissions History
              </h3>
              <p className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Device Node: {deviceId.substring(0, 18)}... · Zero-Auth Receipts
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={syncWithServer}
              disabled={isRefreshing}
              title="Sync latest status from command center"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'var(--accent-cyan)',
                width: 32,
                height: 32,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'var(--text-muted)',
                width: 32,
                height: 32,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Detail View of a Selected Receipt */}
          {selectedReceipt ? (
            <div style={{ animation: 'fadeUp 0.25s ease-out' }}>
              <button
                onClick={() => setSelectedReceipt(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  marginBottom: 12
                }}
              >
                ← Back to All Submissions
              </button>

              <div className="glass-card" style={{ padding: 16, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                    Receipt: {selectedReceipt.id}
                  </span>
                  <StatusBadge status={selectedReceipt.status} />
                </div>

                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                  {selectedReceipt.aiResult?.source_classification || selectedReceipt.title || 'Emissions Observation'}
                </h4>

                {selectedReceipt.imageUrl && (
                  <div
                    style={{
                      width: '100%',
                      height: 160,
                      borderRadius: 8,
                      overflow: 'hidden',
                      marginBottom: 12,
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <img
                      src={selectedReceipt.imageUrl}
                      alt="Capture Evidence"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 6 }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Visual Density
                    </span>
                    <p className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: (selectedReceipt.aiResult?.visual_density_score || 7) > 7 ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
                      {selectedReceipt.aiResult?.visual_density_score || '7.0'}/10
                    </p>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 6 }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Timestamp
                    </span>
                    <p style={{ fontSize: '0.78rem', color: '#e2e8f0', marginTop: 2 }}>
                      {new Date(selectedReceipt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(selectedReceipt.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedReceipt.aiResult?.plume_vector && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: 10, borderRadius: 6, marginBottom: 10, fontSize: '0.78rem', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Wind size={14} />
                    <span>
                      Plume Drift: {selectedReceipt.aiResult.plume_vector.direction_degrees}° at {selectedReceipt.aiResult.plume_vector.estimated_drift_km_per_hr} km/h
                    </span>
                  </div>
                )}

                {selectedReceipt.aiResult?.immediate_health_hazard && (
                  <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.35)', padding: 8, borderRadius: 6, marginBottom: 10, fontSize: '0.75rem', color: '#fb7185', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} />
                    <span>Immediate Public Health Alert Flagged</span>
                  </div>
                )}

                {selectedReceipt.note && (
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: 8, borderRadius: 6, fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 10 }}>
                    <strong>Citizen Note:</strong> {selectedReceipt.note}
                  </div>
                )}

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(15, 23, 42, 0.5)', padding: 10, borderRadius: 6 }}>
                  <strong>Dispatch Recommendation:</strong> {selectedReceipt.aiResult?.dispatch_recommendation || 'Standard atmospheric surveillance protocol logged.'}
                </div>
              </div>
            </div>
          ) : reports.length === 0 ? (
            /* Empty State */
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <History size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
                No Submissions Yet
              </h4>
              <p style={{ fontSize: '0.8rem', lineHeight: 1.5, maxWidth: 320, margin: '0 auto' }}>
                Capture an emissions image on the main screen to submit forensic evidence to Google Gemini Vision. Receipts will be retained here automatically.
              </p>
            </div>
          ) : (
            /* Submissions List */
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Stored Receipts ({reports.length})
                </span>
                <button
                  onClick={handleClearHistory}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.72rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer'
                  }}
                  title="Clear history from local device"
                >
                  <Trash2 size={12} />
                  <span>Clear History</span>
                </button>
              </div>

              {reports.map((report) => {
                const density = report.aiResult?.visual_density_score || 7.0;
                const isHazard = report.aiResult?.immediate_health_hazard;

                return (
                  <div
                    key={report.id}
                    className="glass-card"
                    style={{
                      padding: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      borderLeft: isHazard ? '3px solid var(--accent-rose)' : '3px solid var(--accent-cyan)',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setSelectedReceipt(report)}
                  >
                    {/* Left Icon / Thumbnail */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        overflow: 'hidden',
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}
                    >
                      {report.imageUrl ? (
                        <img src={report.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <FileText size={18} color="var(--accent-cyan)" />
                      )}
                    </div>

                    {/* Middle Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {report.aiResult?.source_classification || report.title || 'Pollution Observation'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <span className="mono" style={{ color: density > 7 ? 'var(--accent-rose)' : 'var(--accent-cyan)', fontWeight: 700 }}>
                          OD: {density}/10
                        </span>
                        <span>•</span>
                        <span>{new Date(report.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Right Badge */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <StatusBadge status={report.status} />
                      <ChevronRight size={14} color="#64748b" />
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(9, 13, 22, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: 'var(--text-muted)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} color="var(--accent-emerald)" />
            <span>Encrypted in Local Storage</span>
          </div>
          <span>VesperAero Node</span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const normStatus = (status || 'pending').toLowerCase();

  if (normStatus === 'dispatched') {
    return (
      <span
        style={{
          fontSize: '0.65rem',
          fontWeight: 800,
          padding: '2px 7px',
          borderRadius: 12,
          background: 'rgba(245, 158, 11, 0.18)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          color: '#fcd34d',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4
        }}
      >
        <Radio size={10} style={{ animation: 'pulse 1.5s infinite' }} />
        DISPATCHED
      </span>
    );
  }

  if (normStatus === 'resolved') {
    return (
      <span
        style={{
          fontSize: '0.65rem',
          fontWeight: 800,
          padding: '2px 7px',
          borderRadius: 12,
          background: 'rgba(16, 185, 129, 0.18)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#34d399',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4
        }}
      >
        <CheckCircle2 size={10} />
        RESOLVED
      </span>
    );
  }

  if (normStatus === 'verified') {
    return (
      <span
        style={{
          fontSize: '0.65rem',
          fontWeight: 800,
          padding: '2px 7px',
          borderRadius: 12,
          background: 'rgba(56, 189, 248, 0.18)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          color: '#38bdf8',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4
        }}
      >
        <CheckCircle2 size={10} />
        VERIFIED
      </span>
    );
  }

  return (
    <span
      style={{
        fontSize: '0.65rem',
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: 12,
        background: 'rgba(148, 163, 184, 0.15)',
        border: '1px solid rgba(148, 163, 184, 0.3)',
        color: '#cbd5e1'
      }}
    >
      PENDING
    </span>
  );
}
