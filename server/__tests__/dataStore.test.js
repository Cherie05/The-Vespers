const dataStore = require('../services/dataStore');

describe('VesperAero DataStore & Cryptographic Audit Engine', () => {
  const mockReportPayload = {
    title: 'Test Industrial Flaring Incident',
    description: 'Elevated petrochemical stack combustion test',
    lat: 31.634,
    lng: 74.872,
    region: 'Punjab Border Corridor',
    country: 'India',
    deviceId: 'dev_test_jest_uuid_001',
    weather: {
      windSpeed: 15.5,
      windDirection: 270,
      temperature: 30.0,
      humidity: 50
    },
    aiResult: {
      source_classification: 'Petrochemical Flare',
      visual_density_score: 8.5,
      immediate_health_hazard: true,
      pollutants_detected: ['PM2.5', 'SO2', 'VOCs', 'Black Carbon'],
      plume_vector: {
        drift_bearing: 90,
        estimated_length_km: 12.5,
        cross_border_risk: true
      }
    }
  };

  let createdReportId;

  test('1. Creates a verified incident report with unique ID and timestamp', () => {
    const report = dataStore.createReport(mockReportPayload);
    expect(report).toBeDefined();
    expect(report.id).toMatch(/^rep_/);
    expect(report.status).toBe('verified');
    expect(report.title).toBe(mockReportPayload.title);
    expect(report.deviceId).toBe('dev_test_jest_uuid_001');
    createdReportId = report.id;
  });

  test('2. Retrieves report by ID', () => {
    const report = dataStore.getReportById(createdReportId);
    expect(report).toBeDefined();
    expect(report.id).toBe(createdReportId);
    expect(report.lat).toBe(31.634);
    expect(report.lng).toBe(74.872);
  });

  test('3. Filters reports by device UUID for zero-auth citizen history', () => {
    const userHistory = dataStore.getReportsByDeviceId('dev_test_jest_uuid_001');
    expect(Array.isArray(userHistory)).toBe(true);
    expect(userHistory.length).toBeGreaterThanOrEqual(1);
    expect(userHistory[0].deviceId).toBe('dev_test_jest_uuid_001');
  });

  test('4. Updates incident status to dispatched and creates cryptographic SHA-256 audit record', () => {
    const updated = dataStore.updateReportStatus(createdReportId, 'dispatched', {
      targetAgency: 'CPCB_PUNJAB_EPA',
      authorizedBy: 'Officer_Cmd_01'
    });

    expect(updated).toBeDefined();
    expect(updated.status).toBe('dispatched');

    // Verify cryptographic audit log record
    const auditLogs = dataStore.getAuditLogs();
    expect(Array.isArray(auditLogs)).toBe(true);
    const matchingAudit = auditLogs.find((a) => a.reportId === createdReportId);
    expect(matchingAudit).toBeDefined();
    expect(matchingAudit.action).toBe('DISPATCH_BROADCAST');
    expect(matchingAudit.targetAgency).toBe('CPCB_PUNJAB_EPA');
    expect(matchingAudit.authHash).toMatch(/^0x[a-f0-9]{64}$/); // Valid 256-bit hex hash
  });

  test('5. Increments incident upvotes', () => {
    const initialUpvotes = dataStore.getReportById(createdReportId).upvotes || 0;
    const upvoted = dataStore.upvoteReport(createdReportId);
    expect(upvoted.upvotes).toBe(initialUpvotes + 1);
  });

  test('6. Computes summary statistics for command dashboard metrics', () => {
    const stats = dataStore.getSummaryStats();
    expect(stats).toBeDefined();
    expect(typeof stats.totalReports).toBe('number');
    expect(typeof stats.activeHazards).toBe('number');
    expect(typeof stats.crossBorderIncidents).toBe('number');
    expect(typeof stats.dispatchedCount).toBe('number');
    expect(Array.isArray(stats.topPollutants)).toBe(true);
  });

  test('7. Exports standardized BRICS-AERO-FED-v1.0 federated schema', () => {
    const fedExport = dataStore.getFederationExport();
    expect(fedExport.protocol).toBe('BRICS-AERO-FED-v1.0');
    expect(fedExport.origin_node).toBe('VESPER-NODE-PRIMARY-01');
    expect(Array.isArray(fedExport.standards_compliance)).toBe(true);
    expect(Array.isArray(fedExport.federated_incidents)).toBe(true);
    expect(fedExport.federated_incidents.length).toBeGreaterThanOrEqual(1);
  });
});
