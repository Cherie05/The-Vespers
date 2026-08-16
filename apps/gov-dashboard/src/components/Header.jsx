import React from 'react';
import { Activity, AlertTriangle, ShieldAlert, Satellite, Share2 } from 'lucide-react';
import RegionSelector from './RegionSelector';

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'pt', label: 'PT' },
  { code: 'ru', label: 'РУ' },
  { code: 'zh', label: '中文' }
];

export default function Header({
  stats,
  firmsCount,
  currentRegion,
  onSelectRegion,
  currentLang,
  onSelectLang,
  onOpenFederationModal,
  t
}) {
  return (
    <header className="dash-header">
      {/* Left: Brand Section with stable width */}
      <div className="brand-section">
        <div className="brand-badge">
          <Activity size={18} color="#fff" />
        </div>
        <div className="brand-text-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="brand-title">VesperAero</span>
            <span className="brand-live-tag">LIVE</span>
          </div>
          <div className="brand-subtitle-line">
            <span className="brand-sub-name" title={t.dashboardTitle}>
              {t.dashboardTitle}
            </span>
          </div>
        </div>
      </div>

      {/* Middle: Compact, Responsive Telemetry Pills (Fixed width, zero jitter) */}
      <div className="stat-pills-row">
        <div className="stat-pill" title={t.totalIncidents}>
          <Activity size={13} color="#38bdf8" />
          <span className="stat-val mono" style={{ color: '#38bdf8' }}>{stats.totalReports || 0}</span>
          <span className="stat-lbl">Nodes</span>
        </div>

        <div className="stat-pill hazard" title={t.immediateHazards}>
          <AlertTriangle size={13} color="#fb7185" />
          <span className="stat-val mono" style={{ color: '#fb7185' }}>{stats.activeHazards || 0}</span>
          <span className="stat-lbl">Hazards</span>
        </div>

        <div className="stat-pill alert" title={t.crossBorderAlerts}>
          <ShieldAlert size={13} color="#fcd34d" />
          <span className="stat-val mono" style={{ color: '#fcd34d' }}>{stats.crossBorderIncidents || 0}</span>
          <span className="stat-lbl">Cross-Border</span>
        </div>

        <div className="stat-pill" title={t.satelliteAnomalies}>
          <Satellite size={13} color="#a855f7" />
          <span className="stat-val mono" style={{ color: '#c084fc' }}>{firmsCount || 0}</span>
          <span className="stat-lbl">Satellites</span>
        </div>
      </div>

      {/* Right: Region Selector, Federation Export, Language Switcher */}
      <div className="dash-header-controls">
        <RegionSelector currentRegion={currentRegion} onSelectRegion={onSelectRegion} t={t} />

        <button
          onClick={onOpenFederationModal}
          className="btn-federation-header"
          title={t.exportData}
        >
          <Share2 size={13} />
          <span className="btn-fed-text">{t.bricsFederation}</span>
        </button>

        {/* Language Segmented Control */}
        <div className="lang-segmented-control">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => onSelectLang(l.code)}
              className={`lang-segment-btn ${currentLang === l.code ? 'active' : ''}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
