import React, { useState } from 'react';
import { Search, AlertTriangle, ShieldAlert, CheckCircle2, ChevronRight, Wind, Flame, Eye } from 'lucide-react';

export default function IncidentFeed({
  reports,
  selectedIncident,
  onSelectIncident,
  onOpenModal,
  onQuickDispatch,
  t
}) {
  const [filter, setFilter] = useState('ALL'); // ALL | HAZARD | CROSS_BORDER | DISPATCHED
  const [search, setSearch] = useState('');

  const filteredReports = reports.filter((r) => {
    // Search matching
    const searchMatch =
      !search ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.region?.toLowerCase().includes(search.toLowerCase()) ||
      r.aiResult?.source_classification?.toLowerCase().includes(search.toLowerCase());

    if (!searchMatch) return false;

    if (filter === 'HAZARD') return r.aiResult?.immediate_health_hazard;
    if (filter === 'CROSS_BORDER') return r.aiResult?.plume_vector?.cross_border_risk;
    if (filter === 'DISPATCHED') return r.status === 'dispatched';

    return true;
  });

  return (
    <aside className="dash-sidebar">
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>{t.incidentFeed}</h2>
          <span className="mono" style={{ fontSize: '0.75rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '2px 8px', borderRadius: '12px' }}>
            {filteredReports.length} Nodes
          </span>
        </div>

        {/* Search box */}
        <div style={{ position: 'relative', marginTop: 10 }}>
          <Search size={14} color="#64748b" style={{ position: 'absolute', left: 10, top: 10 }} />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '8px 10px 8px 32px',
              color: '#fff',
              fontSize: '0.8rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            {t.filterAll}
          </button>
          <button
            className={`filter-tab ${filter === 'HAZARD' ? 'active' : ''}`}
            onClick={() => setFilter('HAZARD')}
          >
            {t.filterHazards}
          </button>
          <button
            className={`filter-tab ${filter === 'CROSS_BORDER' ? 'active' : ''}`}
            onClick={() => setFilter('CROSS_BORDER')}
          >
            {t.filterCrossBorder}
          </button>
          <button
            className={`filter-tab ${filter === 'DISPATCHED' ? 'active' : ''}`}
            onClick={() => setFilter('DISPATCHED')}
          >
            {t.filterDispatched}
          </button>
        </div>
      </div>

      <div className="incident-list">
        {filteredReports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 18px', color: '#64748b' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Wind size={22} color="#38bdf8" />
            </div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
              Active Grid Monitoring
            </h4>
            <p style={{ fontSize: '0.75rem', lineHeight: 1.5, color: '#94a3b8', maxWidth: 220, margin: '0 auto' }}>
              No active incident reports yet. Capture a photo from the Citizen Mobile PWA to stream live forensic analysis here.
            </p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const isSelected = selectedIncident?.id === report.id;
            const isHazard = report.aiResult?.immediate_health_hazard;
            const isCrossBorder = report.aiResult?.plume_vector?.cross_border_risk;
            const density = report.aiResult?.visual_density_score || 7.0;

            return (
              <div
                key={report.id}
                className={`incident-card ${isSelected ? 'active' : ''} ${isHazard ? 'hazard-card' : ''}`}
                onClick={() => onSelectIncident(report)}
              >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                  {report.region}
                </span>
                <span className="mono" style={{ fontSize: '0.68rem', color: '#64748b' }}>
                  {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>
                {report.title}
              </h4>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {isHazard && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <AlertTriangle size={10} /> Hazard
                  </span>
                )}
                {isCrossBorder && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <ShieldAlert size={10} /> Cross-Border
                  </span>
                )}
                {report.status === 'dispatched' && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <CheckCircle2 size={10} /> Dispatched
                  </span>
                )}
              </div>

              {/* Density Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Density:</span>
                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(density / 10) * 100}%`,
                      background: density > 8 ? '#f43f5e' : density > 6 ? '#f59e0b' : '#38bdf8',
                      borderRadius: 3
                    }}
                  />
                </div>
                <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                  {density}
                </span>
              </div>

              {/* Direct Command Center Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Wind size={11} color="#38bdf8" /> {report.weather?.windSpeed || 15} km/h
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {/* Quick Dispatch Action */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onQuickDispatch) onQuickDispatch(report);
                    }}
                    disabled={report.status === 'dispatched'}
                    style={{
                      background: report.status === 'dispatched' ? 'rgba(16, 185, 129, 0.18)' : 'linear-gradient(135deg, #e11d48, #be123c)',
                      border: report.status === 'dispatched' ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: report.status === 'dispatched' ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: report.status === 'dispatched' ? 'none' : '0 2px 8px rgba(225, 29, 72, 0.35)',
                      transition: 'all 0.2s'
                    }}
                    title={report.status === 'dispatched' ? 'Already Dispatched' : 'Direct Inter-Agency Alert'}
                  >
                    {report.status === 'dispatched' ? <CheckCircle2 size={11} color="#34d399" /> : <ShieldAlert size={11} />}
                    <span>{report.status === 'dispatched' ? 'Dispatched' : 'Dispatch'}</span>
                  </button>

                  {/* Forensic Inspect Modal */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenModal(report);
                    }}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      transition: 'all 0.2s'
                    }}
                  >
                    <Eye size={11} />
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            </div>
          );
        }))}
      </div>
    </aside>
  );
}
