import React, { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Download, Copy, Check, ShieldCheck, Activity, FileSpreadsheet } from 'lucide-react';

export default function AnalyticsPanel({ stats, reports, isOpen, setIsOpen, t }) {
  const [copied, setCopied] = useState(false);

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
    const headers = ['IncidentID', 'Timestamp', 'Country', 'Region', 'Latitude', 'Longitude', 'Classification', 'DensityScore', 'WindSpeed_kmh', 'WindDir_deg', 'Hazard', 'CrossBorderRisk', 'Status'];
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

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brics_vesperaero_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 390,
        background: 'rgba(9, 13, 22, 0.96)',
        borderTop: '1px solid rgba(56, 189, 248, 0.25)',
        backdropFilter: 'blur(16px)',
        zIndex: 999,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Toggle header bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: 5, borderRadius: 6 }}>
            <BarChart3 size={16} color="#38bdf8" />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.2px' }}>
            BRICS Forensic Analytics & Atmospheric Telemetry Grid
          </span>
          <span className="mono" style={{ fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '2px 8px', borderRadius: 10 }}>
            {reports.length} Synchronized Nodes
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

          {isOpen ? <ChevronDown size={18} color="#94a3b8" /> : <ChevronUp size={18} color="#94a3b8" />}
        </div>
      </div>

      {/* Expanded content */}
      {isOpen && (
        <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 24 }}>
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
            {(stats.topPollutants && stats.topPollutants.length > 0) ? (
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
      )}
    </div>
  );
}
