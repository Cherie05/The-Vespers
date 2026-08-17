const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DataStore {
  constructor() {
    this.storePath = path.join(__dirname, '../../data/reports-store.json');
    this.reports = [];
    this.auditLogs = [];
    this.subscribers = new Set();
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(this.storePath)) {
        const raw = fs.readFileSync(this.storePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.reports = parsed;
          this.auditLogs = [];
        } else if (parsed && typeof parsed === 'object') {
          this.reports = parsed.reports || [];
          this.auditLogs = parsed.auditLogs || [];
        } else {
          this.reports = [];
          this.auditLogs = [];
        }
        console.log(`[DataStore] Loaded ${this.reports.length} reports and ${this.auditLogs.length} audit logs from storage.`);
      } else {
        this.reports = [];
        this.auditLogs = [];
        this.saveToDisk();
        console.log('[DataStore] Initialized clean empty reports and audit store.');
      }
    } catch (e) {
      console.warn(`[DataStore] Warning loading reports/audit-store: ${e.message}`);
      this.reports = [];
      this.auditLogs = [];
    }
  }

  saveToDisk() {
    try {
      const dir = path.dirname(this.storePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const payload = {
        reports: this.reports,
        auditLogs: this.auditLogs
      };
      fs.writeFileSync(this.storePath, JSON.stringify(payload, null, 2), 'utf8');
    } catch (err) {
      console.error('[DataStore] Failed to write reports to disk:', err.message);
    }
  }

  getAllReports({ region, status, country, hazardOnly } = {}) {
    let result = [...this.reports];

    if (country && country !== 'ALL') {
      result = result.filter(r => (r.country || '').toLowerCase() === country.toLowerCase());
    }

    if (status && status !== 'ALL') {
      result = result.filter(r => (r.status || '').toLowerCase() === status.toLowerCase());
    }

    if (hazardOnly === 'true' || hazardOnly === true) {
      result = result.filter(r => r.aiResult?.immediate_health_hazard === true);
    }

    return result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getReportById(id) {
    return this.reports.find(r => r.id === id);
  }

  getReportsByDeviceId(deviceId) {
    if (!deviceId) return [];
    return this.reports
      .filter(r => r.deviceId === deviceId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getAuditLogs() {
    return [...this.auditLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  createReport(reportData) {
    const newReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      status: 'verified',
      upvotes: 1,
      ...reportData
    };

    this.reports.unshift(newReport);
    this.saveToDisk();
    this.notifySubscribers({ event: 'new_report', report: newReport });
    return newReport;
  }

  updateReportStatus(id, status, metadata = {}) {
    const report = this.getReportById(id);
    if (!report) return null;
    report.status = status;

    let auditRecord = null;
    // When a dispatch or status change occurs, generate an immutable audit record with cryptographic authorization hash
    if (status === 'dispatched' || metadata.createAudit) {
      const targetAgency = metadata.targetAgency || 'ALL_RELEVANT';
      const timestamp = new Date().toISOString();
      const rawHashPayload = `${report.id}:${status}:${targetAgency}:${timestamp}:${report.lat},${report.lng}:VESPER-SECURE-AUDIT`;
      const authHash = '0x' + crypto.createHash('sha256').update(rawHashPayload).digest('hex');

      auditRecord = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        timestamp,
        reportId: report.id,
        reportTitle: report.title,
        action: 'DISPATCH_BROADCAST',
        status,
        targetAgency,
        region: report.region,
        country: report.country,
        coordinates: { lat: report.lat, lng: report.lng },
        classification: report.aiResult?.source_classification || 'Environmental Emission',
        densityScore: report.aiResult?.visual_density_score || null,
        hazard: !!report.aiResult?.immediate_health_hazard,
        crossBorderRisk: !!report.aiResult?.plume_vector?.cross_border_risk,
        authHash
      };

      this.auditLogs.unshift(auditRecord);
    }

    this.saveToDisk();
    this.notifySubscribers({
      event: 'status_update',
      report,
      auditRecord
    });
    return report;
  }

  upvoteReport(id) {
    const report = this.getReportById(id);
    if (!report) return null;
    report.upvotes = (report.upvotes || 0) + 1;
    this.saveToDisk();
    return report;
  }

  getSummaryStats() {
    const total = this.reports.length;
    const hazards = this.reports.filter(r => r.aiResult?.immediate_health_hazard).length;
    const crossBorder = this.reports.filter(r => r.aiResult?.plume_vector?.cross_border_risk).length;
    const dispatched = this.reports.filter(r => r.status === 'dispatched').length;

    const pollutantCounts = {};
    this.reports.forEach(r => {
      (r.aiResult?.pollutants_detected || []).forEach(p => {
        pollutantCounts[p] = (pollutantCounts[p] || 0) + 1;
      });
    });

    return {
      totalReports: total,
      activeHazards: hazards,
      crossBorderIncidents: crossBorder,
      dispatchedCount: dispatched,
      topPollutants: Object.entries(pollutantCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    };
  }

  getFederationExport() {
    return {
      protocol: 'BRICS-AERO-FED-v1.0',
      origin_node: 'VESPER-NODE-PRIMARY-01',
      generated_at: new Date().toISOString(),
      standards_compliance: ['WHO-AQG-2021', 'ISO-14064', 'UN-SDG-11-6'],
      federated_incidents: this.reports.map(r => ({
        incident_id: r.id,
        coordinates: { lat: r.lat, lng: r.lng },
        region: r.region,
        timestamp: r.timestamp,
        classification: r.aiResult?.source_classification,
        density_index: r.aiResult?.visual_density_score,
        meteorology: r.weather,
        plume_vector: r.aiResult?.plume_vector,
        verification_status: r.status
      }))
    };
  }

  subscribe(res) {
    this.subscribers.add(res);
  }

  unsubscribe(res) {
    this.subscribers.delete(res);
  }

  notifySubscribers(data) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of this.subscribers) {
      try {
        client.write(payload);
      } catch (err) {
        this.subscribers.delete(client);
      }
    }
  }
}

module.exports = new DataStore();
