/**
 * Citizen Client Local History & Anonymous Device Identity Storage Utility
 * Zero-auth, non-intrusive local persistence for VesperAero citizen receipts.
 */

const STORAGE_KEY_REPORTS = 'vesperaero_citizen_reports_history';
const STORAGE_KEY_DEVICE = 'vesperaero_device_uuid';

/**
 * Returns or generates a persistent anonymous device UUID.
 * Ensures zero-auth traceability for citizen reports.
 */
export function getDeviceUUID() {
  try {
    let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE);
    if (!deviceId) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        deviceId = `dev_${crypto.randomUUID()}`;
      } else {
        deviceId = `dev_${Math.random().toString(36).substring(2, 11)}_${Date.now().toString(36)}`;
      }
      localStorage.setItem(STORAGE_KEY_DEVICE, deviceId);
    }
    return deviceId;
  } catch (err) {
    console.warn('[HistoryStorage] Unable to access localStorage for device UUID:', err);
    return 'dev_anonymous_fallback';
  }
}

/**
 * Retrieves all stored report receipts from local storage.
 * @returns {Array} Array of historical report objects (newest first).
 */
export function getReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    return [];
  } catch (err) {
    console.warn('[HistoryStorage] Error reading reports history:', err);
    return [];
  }
}

/**
 * Saves a new forensic report receipt to local storage (or updates if existing).
 * @param {Object} report Report payload receipt returned by backend
 * @returns {Array} Updated array of report receipts
 */
export function saveReport(report) {
  if (!report || !report.id) return getReports();

  try {
    const existing = getReports();
    const index = existing.findIndex((r) => r.id === report.id);

    let updatedList;
    if (index >= 0) {
      // Update existing
      updatedList = [...existing];
      updatedList[index] = { ...existing[index], ...report };
    } else {
      // Prepend newest report receipt
      updatedList = [report, ...existing];
    }

    // Limit to 100 most recent local receipts to keep storage lean
    const trimmed = updatedList.slice(0, 100);
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(trimmed));
    return trimmed;
  } catch (err) {
    console.warn('[HistoryStorage] Error saving report receipt:', err);
    return getReports();
  }
}

/**
 * Updates the verification/dispatch status of a specific stored report.
 * @param {string} id Report ID (e.g. rep_...)
 * @param {string} status New status ('verified' | 'dispatched' | 'resolved' | 'pending')
 * @returns {Array} Updated array of reports
 */
export function updateReportStatus(id, status) {
  if (!id || !status) return getReports();

  try {
    const existing = getReports();
    const updatedList = existing.map((r) => (r.id === id ? { ...r, status } : r));
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(updatedList));
    return updatedList;
  } catch (err) {
    console.warn('[HistoryStorage] Error updating report status:', err);
    return getReports();
  }
}

/**
 * Clears local citizen history (useful for citizen testing/reset).
 */
export function clearReports() {
  try {
    localStorage.removeItem(STORAGE_KEY_REPORTS);
  } catch (err) {
    console.warn('[HistoryStorage] Error clearing reports:', err);
  }
}
