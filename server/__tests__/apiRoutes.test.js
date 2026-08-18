const request = require('supertest');
const app = require('../index');

describe('VesperAero Express REST API Integration Tests', () => {
  let createdReportId;

  test('GET /api/health returns 200 and online status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.service).toContain('VesperAero');
  });

  test('GET /api/reports returns active incident list', async () => {
    const res = await request(app).get('/api/reports');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(typeof res.body.count).toBe('number');
  });

  test('GET /api/reports/stats returns summary statistics', async () => {
    const res = await request(app).get('/api/reports/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalReports');
    expect(res.body.data).toHaveProperty('activeHazards');
    expect(res.body.data).toHaveProperty('crossBorderIncidents');
    expect(res.body.data).toHaveProperty('dispatchedCount');
  });

  test('GET /api/reports/history handles missing deviceId gracefully', async () => {
    const res = await request(app).get('/api/reports/history');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/reports/history returns array for valid deviceId', async () => {
    const res = await request(app).get('/api/reports/history?deviceId=dev_seed_punjab');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/reports/audit-logs returns inter-agency dispatch trail', async () => {
    const res = await request(app).get('/api/reports/audit-logs');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('PATCH /api/reports/:id/status updates status and rejects invalid status values', async () => {
    // 1. Fetch any existing report ID
    const listRes = await request(app).get('/api/reports');
    if (listRes.body.data && listRes.body.data.length > 0) {
      const targetId = listRes.body.data[0].id;

      // Test invalid status
      const badRes = await request(app)
        .patch(`/api/reports/${targetId}/status`)
        .send({ status: 'invalid_status_enum' });
      expect(badRes.status).toBe(400);

      // Test valid status dispatch
      const goodRes = await request(app)
        .patch(`/api/reports/${targetId}/status`)
        .send({
          status: 'dispatched',
          targetAgency: 'UNIFIED_BRICS_AIR_COMMAND',
          authorizedBy: 'Officer_Jest_01'
        });
      expect(goodRes.status).toBe(200);
      expect(goodRes.body.data.status).toBe('dispatched');
    }
  });

  test('POST /api/reports/:id/upvote increments upvote tally', async () => {
    const listRes = await request(app).get('/api/reports');
    if (listRes.body.data && listRes.body.data.length > 0) {
      const targetId = listRes.body.data[0].id;
      const res = await request(app).post(`/api/reports/${targetId}/upvote`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.upvotes).toBe('number');
    }
  });

  test('GET /api/weather returns meteorological wind vector', async () => {
    const res = await request(app).get('/api/weather?lat=31.634&lng=74.872');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('windSpeed');
    expect(res.body.data).toHaveProperty('windDirection');
  });

  test('GET /api/weather/forecast returns 24-hour predictive wind forecast', async () => {
    const res = await request(app).get('/api/weather/forecast?lat=31.634&lng=74.872');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toHaveProperty('hoursAhead');
    expect(res.body.data[0]).toHaveProperty('windSpeed');
    expect(res.body.data[0]).toHaveProperty('windDirection');
  });

  test('GET /api/satellite/firms returns satellite thermal anomalies', async () => {
    const res = await request(app).get('/api/satellite/firms?minLat=29.0&maxLat=34.0&minLng=71.0&maxLng=78.0');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/federation/export returns standardized BRICS schema', async () => {
    const res = await request(app).get('/api/federation/export');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.protocol).toBe('BRICS-AERO-FED-v1.0');
    expect(Array.isArray(res.body.data.federated_incidents)).toBe(true);
  });
});
