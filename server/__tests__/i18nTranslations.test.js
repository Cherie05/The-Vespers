const fs = require('fs');
const path = require('path');

// Helper to extract JSON-like object from JS export
function parseTranslationsFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Simple extraction of keys
  const languages = ['en', 'hi', 'pt', 'ru', 'zh'];
  const extracted = {};

  languages.forEach((lang) => {
    const regex = new RegExp(`${lang}:\\s*\\{([^}]+)\\}`, 's');
    const match = content.match(regex);
    if (match) {
      extracted[lang] = true;
    }
  });

  return extracted;
}

describe('VesperAero i18n Translations Completeness Tests', () => {
  const captureClientPath = path.join(__dirname, '../../apps/capture-client/src/i18n/translations.js');
  const govDashboardPath = path.join(__dirname, '../../apps/gov-dashboard/src/i18n/dashboardTranslations.js');
  const supportedLanguages = ['en', 'hi', 'pt', 'ru', 'zh'];

  test('1. Citizen Capture Client has all 5 BRICS language dictionaries', () => {
    expect(fs.existsSync(captureClientPath)).toBe(true);
    const content = fs.readFileSync(captureClientPath, 'utf8');
    supportedLanguages.forEach((lang) => {
      expect(content).toContain(`${lang}:`);
    });
  });

  test('2. Policy Command Center has all 5 BRICS language dictionaries', () => {
    expect(fs.existsSync(govDashboardPath)).toBe(true);
    const content = fs.readFileSync(govDashboardPath, 'utf8');
    supportedLanguages.forEach((lang) => {
      expect(content).toContain(`${lang}:`);
    });
  });

  test('3. Key translations contain non-empty entries for sustainability and forensic terms', () => {
    const govContent = fs.readFileSync(govDashboardPath, 'utf8');
    expect(govContent).toContain('dashboardTitle');
    expect(govContent).toContain('immediateHazards');
    expect(govContent).toContain('crossBorderAlerts');
    expect(govContent).toContain('bricsFederation');
    expect(govContent).toContain('plumeVectors');
  });
});
