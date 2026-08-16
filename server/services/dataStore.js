const fs = require('fs');
const path = require('path');

class DataStore {
  constructor() {
    this.storePath = path.join(__dirname, '../../data/reports-store.json');
    this.reports = [];
    this.subscribers = new Set();
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(this.storePath)) {
        const raw = fs.readFileSync(this.storePath, 'utf8');
        this.reports = JSON.parse(raw);
        console.log(`[DataStore] Loaded ${this.reports.length} verified reports from storage.`);
      } else {
        this.reports = [];
        this.saveToDisk();
        console.log('[DataStore] Initialized clean empty reports store.');
      }
    } catch (e) {
      console.warn(`[DataStore] Warning loading reports: ${e.message}`);
      this.reports = [];
    }
  }

  saveToDisk() {
    try {
      const dir = path.dirname(this.storePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.storePath, JSON.stringify(this.reports, null, 2), 'utf8');
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

  updateReportStatus(id, status) {
    const report = this.getReportById(id);
    if (!report) return null;
    report.status = status;
    this.saveToDisk();
    this.notifySubscribers({ event: 'status_update', report });
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
