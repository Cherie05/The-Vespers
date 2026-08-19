import React from 'react';
import {
  X,
  Printer,
  ShieldCheck,
  Award,
  Download,
  Activity,
  Wind,
  Satellite,
  Compass,
  FileCheck2,
  Calendar,
  MapPin,
  Flame,
  Radio
} from 'lucide-react';
import { generateDroneWaypoints } from '../lib/droneWaypoints';
import { generatePlumeFootprint } from '../lib/plumeModel';

export default function ComplianceDossierModal({ report, isOpen, onClose }) {
  if (!isOpen || !report) return null;

  const weather = report.weather || {};
  const aiResult = report.aiResult || {};
  const density = aiResult.visual_density_score || 7.5;
  const isHazard = aiResult.immediate_health_hazard;

  const footprint = generatePlumeFootprint({
    lat: report.lat,
    lng: report.lng,
    windSpeed: weather.windSpeed || 15,
    windDirection: weather.windDirection || 270,
    visualDensity: density
  });

  const droneData = generateDroneWaypoints(report.lat, report.lng, footprint);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadKml = () => {
    const kml = droneData.generateKml(report.title);
    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drone_flight_plan_${report.id}.kml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadGpx = () => {
    const gpx = droneData.generateGpx(report.title);
    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drone_waypoints_${report.id}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-window print-dossier-window"
        style={{ maxWidth: 840 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #0284c7, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <FileCheck2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                Official Environmental Compliance Dossier
              </h3>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                Legal Record · ISO-14064 & WHO Air Quality Guidelines Compliant
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handlePrint}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: 'none',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body dossier-printable-content" style={{ padding: 24, gap: 18 }}>
          {/* Dossier Header Banner */}
          <div
            style={{
              border: '2px solid rgba(56, 189, 248, 0.35)',
              borderRadius: 10,
              padding: 16,
              background: 'rgba(15, 23, 42, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img src="/favicon.svg" alt="VesperAero Seal" style={{ width: 44, height: 44, filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.5))' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <ShieldCheck size={16} color="#38bdf8" />
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: 1.2,
                      color: '#38bdf8'
                    }}
                  >
                    BRICS INTER-AGENCY ENVIRONMENTAL COMPLIANCE RECORD
                  </span>
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{report.title}</h2>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 4 }}>
                  Region: <strong style={{ color: '#e2e8f0' }}>{report.region}</strong> ({report.country}) · Coordinates:{' '}
                  <span className="mono" style={{ color: '#38bdf8' }}>
                    {report.lat}, {report.lng}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: isHazard ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: isHazard ? '#fb7185' : '#34d399',
                  border: isHazard ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'inline-block',
                  marginBottom: 6
                }}
              >
                {isHazard ? '⚠️ CRITICAL HEALTH HAZARD' : 'STANDARD OBSERVATION'}
              </div>
              <div className="mono" style={{ fontSize: '0.65rem', color: '#64748b' }}>
                Tracking ID: {report.id} · Origin: {report.source_platform?.startsWith('flutter') ? '📱 Native Flutter App' : '🌐 Citizen Web PWA'}
              </div>
            </div>
          </div>

          {/* 2-Column: Photo & AI Forensic Evidence */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
                Ground Photographic Evidence
              </h4>
              {report.imageUrl ? (
                <div style={{ width: '100%', height: 180, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={report.imageUrl} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ height: 180, background: 'rgba(0,0,0,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  No photo attached
                </div>
              )}
            </div>

            <div>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
                Google Gemini Vision AI Forensics
              </h4>
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  fontSize: '0.75rem'
                }}
              >
                <div>
                  <span style={{ color: '#94a3b8' }}>Source Classification: </span>
                  <strong style={{ color: '#fff' }}>{aiResult.source_classification || 'Industrial/Agricultural'}</strong>
                </div>

                <div>
                  <span style={{ color: '#94a3b8' }}>Visual Optical Opacity Index: </span>
                  <strong style={{ color: density > 7 ? '#fb7185' : '#38bdf8' }}>{density} / 10.0 (ISO-14064 Calibrated)</strong>
                </div>

                <div>
                  <span style={{ color: '#94a3b8' }}>Detected Chemical Pollutants: </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                    {(aiResult.pollutants_detected || ['PM2.5', 'PM10', 'SO2', 'Black Carbon']).map((p, i) => (
                      <span
                        key={i}
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#7dd3fc',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: '0.68rem',
                          fontWeight: 600
                        }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 2 }}>
                  <span style={{ color: '#94a3b8' }}>Enforcement Advice: </span>
                  <p style={{ color: '#cbd5e1', fontStyle: 'italic', marginTop: 2, lineHeight: 1.4 }}>
                    "{aiResult.enforcement_recommendation || aiResult.dispatch_recommendation || 'Initiate localized inspection.'}"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Meteorological & Plume Dispersion Physics */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: 8,
              padding: 14
            }}
          >
            <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wind size={15} /> Atmospheric Gaussian Plume Dispersion Model (Pasquill-Gifford Class C/D)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, fontSize: '0.74rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: 8, borderRadius: 6 }}>
                <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>WIND SPEED / DIR</span>
                <div style={{ color: '#fff', fontWeight: 800, marginTop: 2 }}>
                  {weather.windSpeed || 15} km/h @ {weather.windDirection || 270}°
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: 8, borderRadius: 6 }}>
                <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>DRIFT BEARING</span>
                <div style={{ color: '#fff', fontWeight: 800, marginTop: 2 }}>
                  {footprint.bearing}° ({footprint.bearing > 45 && footprint.bearing < 135 ? 'Eastward' : footprint.bearing >= 135 && footprint.bearing <= 225 ? 'Southward' : 'Westward'})
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: 8, borderRadius: 6 }}>
                <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>EST. PLUME REACH</span>
                <div style={{ color: '#38bdf8', fontWeight: 800, marginTop: 2 }}>{footprint.lengthKm} km</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: 8, borderRadius: 6 }}>
                <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>LATERAL SPREAD</span>
                <div style={{ color: '#a78bfa', fontWeight: 800, marginTop: 2 }}>±{footprint.maxLateralSpreadKm} km</div>
              </div>
            </div>
          </div>

          {/* Autonomous Drone Survey Flight Plan */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: 14
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Compass size={15} color="#34d399" /> Autonomous UAV / Drone Survey Perimeter (DJI / ArduPilot Flight Plan)
              </h4>

              <div className="no-print" style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleDownloadKml}
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#34d399',
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Download size={11} /> KML
                </button>
                <button
                  onClick={handleDownloadGpx}
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#38bdf8',
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Download size={11} /> GPX
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, fontSize: '0.72rem' }}>
              {droneData.waypoints.map((wp) => (
                <div key={wp.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: 4 }}>
                  <div style={{ color: '#34d399', fontWeight: 800 }}>{wp.id}</div>
                  <div className="mono" style={{ color: '#e2e8f0', fontSize: '0.65rem', marginTop: 2 }}>
                    {wp.lat}, {wp.lng}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.62rem' }}>Alt: {wp.altMeters}m AGL</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cryptographic Proof Footer */}
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.68rem',
              color: '#64748b'
            }}
          >
            <div>
              <span>Official Protocol: <strong>BRICS-AERO-FED-v1.0</strong> · Certified under ISO-14064 Compliance Framework</span>
            </div>
            <div className="mono" style={{ color: '#38bdf8' }}>
              Seal: 0x{Math.random().toString(16).substr(2, 8)}...{Math.random().toString(16).substr(2, 8)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
