import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MapView from './components/MapView';
import IncidentFeed from './components/IncidentFeed';
import IncidentModal from './components/IncidentModal';
import DispatchModal from './components/DispatchModal';
import AnalyticsPanel from './components/AnalyticsPanel';
import { BRICS_REGIONS } from './components/RegionSelector';
import { dashboardTranslations } from './i18n/dashboardTranslations';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [lang, setLang] = useState('en');
  const [currentRegion, setCurrentRegion] = useState(BRICS_REGIONS[0]); // Punjab default
  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [stats, setStats] = useState({ totalReports: 0, activeHazards: 0, crossBorderIncidents: 0, dispatchedCount: 0 });
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [modalIncident, setModalIncident] = useState(null);
  const [dispatchIncident, setDispatchIncident] = useState(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
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
  }, [currentRegion, fetchHotspots]);

  useEffect(() => {
    fetchReports();
    fetchStats();

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
          } else if (data.event === 'status_update' && data.report) {
            setReports((prev) =>
              prev.map((r) => (r.id === data.report.id ? { ...r, status: data.report.status } : r))
            );
            fetchStats();
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
    }, 15000);

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, [fetchReports, fetchStats]);

  // Handle region switch
  const handleSelectRegion = (region) => {
    setCurrentRegion(region);
    setSelectedIncident(null);
    fetchHotspots(region);
  };

  // Action feedback toast state
  const [actionToast, setActionToast] = useState(null);

  // Handle Quick Dispatch directly from feed or map
  const handleQuickDispatch = async (report) => {
    try {
      const res = await fetch(`${API_BASE}/api/reports/${report.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dispatched' })
      });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) => (r.id === report.id ? { ...r, status: 'dispatched' } : r))
        );
        fetchStats();
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
  const handleConfirmDispatch = async (reportId) => {
    try {
      const res = await fetch(`${API_BASE}/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dispatched' })
      });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: 'dispatched' } : r))
        );
        fetchStats();
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
          border: '1px solid #10b981',
          boxShadow: '0 12px 36px rgba(0,0,0,0.8), 0 0 20px rgba(16, 185, 129, 0.3)',
          borderRadius: 10,
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: '#fff',
          backdropFilter: 'blur(16px)',
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#34d399' }}>{actionToast.title}</div>
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
        {/* Interactive Geospatial Map */}
        <MapView
          reports={reports}
          hotspots={hotspots}
          selectedIncident={selectedIncident}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
          onOpenModal={(inc) => setModalIncident(inc)}
          onQuickDispatch={handleQuickDispatch}
          currentRegion={currentRegion}
          layers={layers}
          setLayers={setLayers}
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
          t={t}
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
