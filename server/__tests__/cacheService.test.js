const cacheService = require('../services/cacheService');

describe('VesperAero High-Performance TTL Cache Service', () => {
  beforeEach(() => {
    cacheService.flush();
  });

  test('1. Sets and retrieves data from cache within TTL', () => {
    const mockWeather = { windSpeed: 18.2, windDirection: 290 };
    cacheService.set('test_weather_key', mockWeather, 5000);

    const retrieved = cacheService.get('test_weather_key');
    expect(retrieved).toBeDefined();
    expect(retrieved.windSpeed).toBe(18.2);
    expect(retrieved.windDirection).toBe(290);
  });

  test('2. Returns null for non-existent or expired keys', (done) => {
    cacheService.set('short_lived_key', { temp: 25 }, 50); // 50ms TTL

    setTimeout(() => {
      const expired = cacheService.get('short_lived_key');
      expect(expired).toBeNull();
      done();
    }, 60);
  });

  test('3. Correctly tracks active cache keys count', () => {
    cacheService.set('key_1', 'val_1', 10000);
    cacheService.set('key_2', 'val_2', 10000);
    expect(cacheService.size()).toBe(2);

    cacheService.delete('key_1');
    expect(cacheService.size()).toBe(1);
  });
});
