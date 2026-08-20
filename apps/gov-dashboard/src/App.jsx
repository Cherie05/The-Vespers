import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MapView from './components/MapView';
import IncidentFeed from './components/IncidentFeed';
import IncidentModal from './components/IncidentModal';
import DispatchModal from './components/DispatchModal';
import AnalyticsPanel from './components/AnalyticsPanel';
import ComplianceDossierModal from './components/ComplianceDossierModal';
import { BRICS_REGIONS } from './components/RegionSelector';
import { dashboardTranslations } from './i18n/dashboardTranslations';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://web-production-9805d.up.railway.app' : '');

export default function App() {
  const [lang, setLang] = useState('en');
  const [currentRegion, setCurrentRegion] = useState(BRICS_REGIONS[0]); // Punjab default
  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [stats, setStats] = useState({ totalReports: 0, activeHazards: 0, crossBorderIncidents: 0, dispatchedCount: 0, topPollutants: [] });
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [modalIncident, setModalIncident] = useState(null);
  const [dispatchIncident, setDispatchIncident] = useState(null);
  const [dossierIncident, setDossierIncident] = useState(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [forecastOffsetHours, setForecastOffsetHours] = useState(0);
  const [forecastData, setForecastData] = useState([]);
  const [layers, setLayers] = useState({
    pins: true,
    plume: true,
    firms: true,
    heatmap: false
  });

  const t = dashboardTranslations[lang] || dashboardTranslations.en;

  // Fetch reports
  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) setReports(json.data);
      }
    } catch (e) {
      console.warn('Reports fetch error:', e);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports/stats`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) setStats(json.data);
      }
    } catch (e) {
      console.warn('Stats fetch error:', e);
    }
  }, []);

  // Fetch inter-agency dispatch audit logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports/audit-logs`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) setAuditLogs(json.data);
      }
    } catch (e) {
      console.warn('Audit logs fetch error:', e);
    }
  }, []);

  // Fetch 24-hour predictive wind forecast for region
  const fetchForecast = useCallback(async (region = currentRegion) => {
    try {
      const res = await fetch(`${API_BASE}/api/weather/forecast?lat=${region.lat}&lng=${region.lng}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) setForecastData(json.data);
      }
    } catch (e) {
      console.warn('Forecast fetch error:', e);
    }
  }, [currentRegion]);

  // Fetch FIRMS satellite hotspots for active region
  const fetchHotspots = useCallback(async (region = currentRegion) => {
    try {
      const minLat = (region.lat - 2.5).toFixed(2);
      const maxLat = (region.lat + 2.5).toFixed(2);
      const minLng = (region.lng - 3.5).toFixed(2);
      const maxLng = (region.lng + 3.5).toFixed(2);
      const res = await fetch(`${API_BASE}/api/satellite/firms?minLat=${minLat}&maxLat=${maxLat}&minLng=${minLng}&maxLng=${maxLng}&days=3`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) setHotspots(json.data);
      }
    } catch (e) {
      console.warn('FIRMS fetch error:', e);
    }
  }, [currentRegion]);

  useEffect(() => {
    fetchHotspots(currentRegion);
    fetchForecast(currentRegion);
  }, [currentRegion, fetchHotspots, fetchForecast]);

  useEffect(() => {
    fetchReports();
    fetchStats();
    fetchAuditLogs();

    // Setup SSE listener for real-time live events
    let eventSource;
    try {
      eventSource = new EventSource(`${API_BASE}/api/reports/stream`);
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.event === 'new_report' && data.report) {
            setReports((prev) => [data.report, ...prev.filter((r) => r.id !== data.report.id)]);
            fetchStats();
            fetchAuditLogs();
          } else if (data.event === 'status_update' && data.report) {
            setReports((prev) =>
              prev.map((r) => (r.id === data.report.id ? { ...r, status: data.report.status } : r))
            );
            fetchStats();
            fetchAuditLogs();
          }
        } catch (err) {
          console.warn('SSE message parse error:', err);
        }
      };
    } catch (err) {
      console.warn('SSE not available, falling back to polling');
    }

    const interval = setInterval(() => {
      fetchReports();
      fetchStats();
      fetchAuditLogs();
    }, 15000);

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, [fetchReports, fetchStats, fetchAuditLogs]);

  // Handle region switch
  const handleSelectRegion = (region) => {
    setCurrentRegion(region);
    setSelectedIncident(null);
    setForecastOffsetHours(0);
    fetchHotspots(region);
    fetchForecast(region);
  };

  // Action feedback toast state
  const [actionToast, setActionToast] = useState(null);

  // Handle Citizen Health Advisory Broadcast
  const handleBroadcastAdvisory = (report) => {
    setActionToast({
      type: 'advisory',
      title: '📢 Public Health Advisory Broadcasted',
      message: `Emergency SMS & PWA alert transmitted to downwind residents for ${report.title} (${report.region})`
    });
    setTimeout(() => setActionToast(null), 5500);
  };

  // Handle Quick Dispatch directly from feed or map
  const handleQuickDispatch = async (report) => {
    try {
      const res = await fetch(`${API_BASE}/api/reports/${report.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dispatched', targetAgency: 'ALL_RELEVANT' })
      });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) => (r.id === report.id ? { ...r, status: 'dispatched' } : r))
        );
        fetchStats();
        fetchAuditLogs();
        setActionToast({
          type: 'dispatch',
          title: '⚡ Inter-Agency Alert Dispatched',
          message: `Broadcasted to Unified BRICS Cross-Border Air Command for ${report.title} (${report.region})`
        });
        setTimeout(() => setActionToast(null), 4500);
      }
    } catch (e) {
      console.error('Quick dispatch failed:', e);
    }
  };

  // Handle incident card click in feed
  const handleSelectIncident = (incident) => {
    setSelectedIncident(incident);
  };

  // Handle Dispatch confirmation from modal
  const handleConfirmDispatch = async (reportId, targetAgency = 'ALL_RELEVANT') => {
    try {
      const res = await fetch(`${API_BASE}/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dispatched', targetAgency })
      });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: 'dispatched' } : r))
        );
        fetchStats();
        fetchAuditLogs();
        const found = reports.find(r => r.id === reportId);
        setActionToast({
          type: 'dispatch',
          title: '⚡ Inter-Agency Alert Confirmed',
          message: `Joint environmental response units notified for ${found?.title || reportId}`
        });
        setTimeout(() => setActionToast(null), 4500);
      }
    } catch (e) {
      console.error('Dispatch status update failed:', e);
    }
  };

  return (
    <>
      {/* Floating Action Feedback Toast Banner */}
      {actionToast && (
        <div style={{
          position: 'fixed',
          top: 72,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: 'rgba(10, 15, 26, 0.96)',
          border: actionToast.type === 'advisory' ? '1px solid #f59e0b' : '1px solid #10b981',
          boxShadow: actionToast.type === 'advisory'
            ? '0 12px 36px rgba(0,0,0,0.8), 0 0 20px rgba(245, 158, 11, 0.35)'
            : '0 12px 36px rgba(0,0,0,0.8), 0 0 20px rgba(16, 185, 129, 0.3)',
          borderRadius: 10,
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: '#fff',
          backdropFilter: 'blur(16px)',
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: actionToast.type === 'advisory' ? '#f59e0b' : '#10b981',
            boxShadow: actionToast.type === 'advisory' ? '0 0 10px #f59e0b' : '0 0 10px #10b981'
          }}></div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: actionToast.type === 'advisory' ? '#fcd34d' : '#34d399' }}>
              {actionToast.title}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: 2 }}>{actionToast.message}</div>
          </div>
          <button
            onClick={() => setActionToast(null)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', marginLeft: 8 }}
          >
            ✕
          </button>
        </div>
      )}

      <Header
        stats={stats}
        firmsCount={hotspots.length}
        currentRegion={currentRegion}
        onSelectRegion={handleSelectRegion}
        currentLang={lang}
        onSelectLang={setLang}
        onOpenFederationModal={() => setIsAnalyticsOpen(true)}
        t={t}
      />

      <main className="dash-body">
        {/* Interactive Geospatial Map with 24h Predictive Plume Slider */}
        <MapView
          reports={reports}
          hotspots={hotspots}
          selectedIncident={selectedIncident}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
          onOpenModal={(inc) => setModalIncident(inc)}
          onQuickDispatch={handleQuickDispatch}
          onOpenDossier={(inc) => setDossierIncident(inc)}
          onBroadcastAdvisory={handleBroadcastAdvisory}
          currentRegion={currentRegion}
          layers={layers}
          setLayers={setLayers}
          forecastOffsetHours={forecastOffsetHours}
          setForecastOffsetHours={setForecastOffsetHours}
          forecastData={forecastData}
          t={t}
        />

        {/* Live Sidebar Incident Feed */}
        <IncidentFeed
          reports={reports}
          selectedIncident={selectedIncident}
          onSelectIncident={handleSelectIncident}
          onOpenModal={(inc) => setModalIncident(inc)}
          onQuickDispatch={handleQuickDispatch}
          t={t}
        />

        {/* Bottom Collapsible Analytics & Federation Panel */}
        <AnalyticsPanel
          stats={stats}
          reports={reports}
          auditLogs={auditLogs}
          isOpen={isAnalyticsOpen}
          setIsOpen={setIsAnalyticsOpen}
          t={t}
        />
      </main>

      {/* Forensic Inspection Modal */}
      {modalIncident && (
        <IncidentModal
          incident={modalIncident}
          onClose={() => setModalIncident(null)}
          onOpenDispatch={(inc) => {
            setModalIncident(null);
            setDispatchIncident(inc);
          }}
          onOpenDossier={(inc) => {
            setModalIncident(null);
            setDossierIncident(inc);
          }}
          onBroadcastAdvisory={handleBroadcastAdvisory}
          t={t}
        />
      )}

      {/* Official Environmental Compliance Dossier Print Modal */}
      {dossierIncident && (
        <ComplianceDossierModal
          report={dossierIncident}
          isOpen={!!dossierIncident}
          onClose={() => setDossierIncident(null)}
        />
      )}

      {/* Authority Dispatch Modal */}
      {dispatchIncident && (
        <DispatchModal
          incident={dispatchIncident}
          onClose={() => setDispatchIncident(null)}
          onConfirmDispatch={handleConfirmDispatch}
          t={t}
        />
      )}
    </>
  );
}
