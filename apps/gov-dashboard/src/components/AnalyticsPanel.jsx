import React, { useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Activity,
  FileSpreadsheet,
  Radio,
  Search,
  KeyRound
} from 'lucide-react';

export default function AnalyticsPanel({
  stats,
  reports,
  auditLogs = [],
  isOpen,
  setIsOpen,
  t
}) {
  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' | 'audit'
  const [copied, setCopied] = useState(false);
  const [copiedHash, setCopiedHash] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Group reports by source classification
  const sourceBreakdown = {};
  reports.forEach((r) => {
    const src = r.aiResult?.source_classification || 'Other';
    sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
  });

  const getFederationPayload = () => ({
    protocol: 'BRICS-AERO-FED-v1.0',
    timestamp: new Date().toISOString(),
    standards: ['WHO-AQG-2021', 'ISO-14064', 'UN-SDG-11-6'],
    total_incidents: reports.length,
    active_incidents: reports.map((r) => ({
      id: r.id,
      coordinates: [r.lat, r.lng],
      region: r.region,
      country: r.country,
      classification: r.aiResult?.source_classification,
      density_index: r.aiResult?.visual_density_score,
      meteorology: r.weather,
      plume_vector: r.aiResult?.plume_vector,
      status: r.status,
      timestamp: r.timestamp
    }))
  });

  const handleCopyFederation = () => {
    navigator.clipboard.writeText(JSON.stringify(getFederationPayload(), null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHash = (hash, id) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleDownloadGeoJson = () => {
    const geoJson = {
      type: 'FeatureCollection',
      features: reports.map((r) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [r.lng, r.lat]
        },
        properties: {
          id: r.id,
          title: r.title,
          classification: r.aiResult?.source_classification,
          densityScore: r.aiResult?.visual_density_score,
          windSpeed: r.weather?.windSpeed,
          windDirection: r.weather?.windDirection,
          hazard: r.aiResult?.immediate_health_hazard,
          crossBorderRisk: r.aiResult?.plume_vector?.cross_border_risk,
          timestamp: r.timestamp
        }
      }))
    };

    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brics_vesperaero_telemetry_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const headers = [
      'IncidentID',
      'Timestamp',
      'Country',
      'Region',
      'Latitude',
      'Longitude',
      'Classification',
      'DensityScore',
      'WindSpeed_kmh',
      'WindDir_deg',
      'Hazard',
      'CrossBorderRisk',
      'Status'
    ];
    const rows = reports.map((r) => [
      r.id,
      r.timestamp,
      `"${r.country || ''}"`,
      `"${r.region || ''}"`,
      r.lat,
      r.lng,
      `"${r.aiResult?.source_classification || ''}"`,
      r.aiResult?.visual_density_score || '',
      r.weather?.windSpeed || '',
      r.weather?.windDirection || '',
      r.aiResult?.immediate_health_hazard ? 'YES' : 'NO',
      r.aiResult?.plume_vector?.cross_border_risk ? 'YES' : 'NO',
      r.status
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brics_vesperaero_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAuditCsv = () => {
    const headers = [
      'AuditID',
      'Timestamp',
      'ReportID',
      'ReportTitle',
      'Action',
      'Status',
      'TargetAgency',
      'Region',
      'Country',
      'Latitude',
      'Longitude',
      'Classification',
      'DensityScore',
      'Hazard',
      'CrossBorderRisk',
      'AuthorizationHash'
    ];

    const rows = auditLogs.map((log) => [
      log.id,
      log.timestamp,
      log.reportId,
      `"${log.reportTitle || ''}"`,
      log.action || 'DISPATCH_BROADCAST',
      log.status || 'dispatched',
      `"${log.targetAgency || 'ALL_RELEVANT'}"`,
      `"${log.region || ''}"`,
      `"${log.country || ''}"`,
      log.coordinates?.lat || '',
      log.coordinates?.lng || '',
      `"${log.classification || ''}"`,
      log.densityScore || '',
      log.hazard ? 'YES' : 'NO',
      log.crossBorderRisk ? 'YES' : 'NO',
      `"${log.authHash || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brics_vesperaero_audit_logs_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAuditGeoJson = () => {
    const geoJson = {
      type: 'FeatureCollection',
      features: auditLogs.map((log) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [log.coordinates?.lng || 0, log.coordinates?.lat || 0]
        },
        properties: {
          auditId: log.id,
          reportId: log.reportId,
          reportTitle: log.reportTitle,
          targetAgency: log.targetAgency,
          action: log.action,
          status: log.status,
          region: log.region,
          country: log.country,
          classification: log.classification,
          densityScore: log.densityScore,
          authHash: log.authHash,
          timestamp: log.timestamp
        }
      }))
    };

    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brics_vesperaero_audit_trail_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      (log.reportId || '').toLowerCase().includes(q) ||
      (log.reportTitle || '').toLowerCase().includes(q) ||
      (log.targetAgency || '').toLowerCase().includes(q) ||
      (log.region || '').toLowerCase().includes(q) ||
      (log.authHash || '').toLowerCase().includes(q)
    );
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 390,
        background: 'rgba(9, 13, 22, 0.97)',
        borderTop: '1px solid rgba(56, 189, 248, 0.25)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        zIndex: 999,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Header bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          borderBottom: isOpen ? '1px solid rgba(255,255,255,0.08)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: 5, borderRadius: 6 }}>
            <BarChart3 size={16} color="#38bdf8" />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.2px' }}>
            BRICS Forensic Analytics & Atmospheric Telemetry Grid
          </span>

          {/* Navigation Tabs when panel is open or closed */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setActiveTab('telemetry');
                if (!isOpen) setIsOpen(true);
              }}
              style={{
                background: activeTab === 'telemetry' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: activeTab === 'telemetry' ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                color: activeTab === 'telemetry' ? '#38bdf8' : '#94a3b8',
                padding: '3px 9px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <Activity size={12} />
              <span>Telemetry Grid ({reports.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('audit');
                if (!isOpen) setIsOpen(true);
              }}
              style={{
                background: activeTab === 'audit' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: activeTab === 'audit' ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                color: activeTab === 'audit' ? '#34d399' : '#94a3b8',
                padding: '3px 9px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <ShieldCheck size={12} />
              <span>Audit History & Logs ({auditLogs.length})</span>
            </button>
          </div>
        </div>

        {/* Right side export controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {activeTab === 'telemetry' ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadGeoJson();
                }}
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#34d399',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer'
                }}
                title="Download GIS GeoJSON Layer"
              >
                <Download size={12} />
                <span>GeoJSON</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadCsv();
                }}
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: '#fcd34d',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer'
                }}
                title="Export CSV Table"
              >
                <FileSpreadsheet size={12} />
                <span>CSV</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyFederation();
                }}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#38bdf8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer'
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Copied BRICS JSON' : 'Copy Federated Schema'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadAuditGeoJson();
                }}
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#34d399',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer'
                }}
                title="Download Audit GeoJSON"
              >
                <Download size={12} />
                <span>Audit GeoJSON</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadAuditCsv();
                }}
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: '#fcd34d',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer'
                }}
                title="Download Audit CSV"
              >
                <FileSpreadsheet size={12} />
                <span>Audit CSV</span>
              </button>
            </>
          )}

          {isOpen ? <ChevronDown size={18} color="#94a3b8" /> : <ChevronUp size={18} color="#94a3b8" />}
        </div>
      </div>

      {/* Expanded content */}
      {isOpen && (
        <div style={{ padding: '16px 20px', maxHeight: '38vh', overflowY: 'auto' }}>
          {activeTab === 'telemetry' ? (
            /* TAB 1: Atmospheric Telemetry & Distribution Grid */
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 24 }}>
              {/* Emission Sources */}
              <div>
                <h4 style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.5px' }}>
                  Emission Classification Distribution
                </h4>
                {Object.keys(sourceBreakdown).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(sourceBreakdown).slice(0, 5).map(([src, count]) => (
                      <div key={src} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '78%' }}>
                          {src}
                        </span>
                        <span className="mono" style={{ color: '#38bdf8', fontWeight: 800, background: 'rgba(56, 189, 248, 0.15)', padding: '1px 8px', borderRadius: 4 }}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>No verified emission reports yet.</p>
                )}
              </div>

              {/* Top Pollutants */}
              <div>
                <h4 style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.5px' }}>
                  Dominant Chemical Species
                </h4>
                {stats.topPollutants && stats.topPollutants.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {stats.topPollutants.map((p) => (
                      <div
                        key={p.name}
                        style={{
                          background: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        <span style={{ color: '#fff', fontWeight: 700 }}>{p.name}</span>
                        <span className="mono" style={{ color: '#34d399', fontSize: '0.72rem', fontWeight: 800 }}>
                          ×{p.count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>No chemical species detected yet.</p>
                )}
              </div>

              {/* Interoperability compliance */}
              <div>
                <h4 style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.5px' }}>
                  BRICS Federation Protocol
                </h4>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.6, background: 'rgba(15, 23, 42, 0.6)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p>• Protocol: <span style={{ color: '#38bdf8', fontWeight: 600 }}>BRICS-AERO-FED-v1.0</span></p>
                  <p>• Node: <span style={{ color: '#34d399', fontWeight: 600 }}>VESPER-PRIMARY-01</span></p>
                  <p>• Trans-boundary Liaison: <span style={{ color: '#fcd34d', fontWeight: 600 }}>Active Inter-Agency Sync</span></p>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: Inter-Agency Incident Audit History & Logs */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Search & Filter Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ position: 'relative', maxWidth: 320, width: '100%' }}>
                  <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter by Report ID, Agency, Region..."
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      padding: '6px 10px 6px 30px',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem', color: '#94a3b8' }}>
                  <ShieldCheck size={14} color="#10b981" />
                  <span>Immutable SHA-256 Authority Ledger</span>
                </div>
              </div>

              {/* Audit Table */}
              {filteredAuditLogs.length > 0 ? (
                <div style={{ overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <th style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 700 }}>Timestamp</th>
                        <th style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 700 }}>Incident ID & Title</th>
                        <th style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 700 }}>Target Agency</th>
                        <th style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 700 }}>Region / Country</th>
                        <th style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 700 }}>Classification / OD</th>
                        <th style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 700 }}>Action / Status</th>
                        <th style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 700 }}>Security Auth Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuditLogs.map((log) => {
                        const isCopied = copiedHash === log.id;
                        return (
                          <tr
                            key={log.id}
                            style={{
                              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                              transition: 'background 0.15s'
                            }}
                          >
                            <td style={{ padding: '8px 12px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                              {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                              <span className="mono" style={{ color: '#94a3b8' }}>
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </td>

                            <td style={{ padding: '8px 12px' }}>
                              <div className="mono" style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.72rem' }}>
                                {log.reportId}
                              </div>
                              <div style={{ color: '#fff', fontSize: '0.74rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {log.reportTitle || 'Emissions Event'}
                              </div>
                            </td>

                            <td style={{ padding: '8px 12px', color: '#fcd34d', fontWeight: 600 }}>
                              {formatAgencyName(log.targetAgency)}
                            </td>

                            <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>
                              {log.region}
                              {log.country ? ` (${log.country})` : ''}
                            </td>

                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ color: '#e2e8f0', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {log.classification || 'Emission Plume'}
                              </div>
                              {log.densityScore && (
                                <div className="mono" style={{ color: log.densityScore > 7 ? '#fb7185' : '#38bdf8', fontSize: '0.7rem' }}>
                                  OD: {log.densityScore}/10
                                </div>
                              )}
                            </td>

                            <td style={{ padding: '8px 12px' }}>
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                  background: 'rgba(245, 158, 11, 0.15)',
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
                            </td>

                            <td style={{ padding: '8px 12px' }}>
                              <button
                                onClick={() => handleCopyHash(log.authHash, log.id)}
                                style={{
                                  background: 'rgba(15, 23, 42, 0.9)',
                                  border: '1px solid rgba(56, 189, 248, 0.25)',
                                  color: isCopied ? '#34d399' : '#94a3b8',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontSize: '0.68rem',
                                  fontFamily: 'monospace',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  cursor: 'pointer'
                                }}
                                title="Click to copy full SHA-256 Auth Hash"
                              >
                                <KeyRound size={10} color={isCopied ? '#34d399' : '#38bdf8'} />
                                <span>{log.authHash ? `${log.authHash.substring(0, 10)}...${log.authHash.slice(-6)}` : '0xSECURE_HASH'}</span>
                                {isCopied ? <Check size={10} /> : <Copy size={10} />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b' }}>
                  <ShieldCheck size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    No inter-agency dispatches recorded in the audit trail yet.
                  </p>
                  <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                    Dispatch an incident from the telemetry feed or geospatial map to generate an immutable SHA-256 audit record.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatAgencyName(code) {
  switch (code) {
    case 'ALL_RELEVANT':
      return '⚡ Unified BRICS Air Command';
    case 'CPCB_IN':
      return '🇮🇳 Central Pollution Control Board';
    case 'PUNJAB_EPA':
      return '🇵🇰 Punjab EPA (Trans-boundary)';
    case 'IBAMA_BR':
      return '🇧🇷 IBAMA & Prevfogo';
    case 'DARDLEA_ZA':
      return '🇿🇦 Mpumalanga Inspectorate';
    case 'SHANGHAI_EEB':
      return '🇨🇳 Shanghai Ecology & Environment';
    default:
      return code || '⚡ BRICS Air Command';
  }
}
