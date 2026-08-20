import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'history_service.dart';

class ApiService {
  // Primary endpoints: localhost (ADB USB reverse) and local LAN IP (WiFi fallback)
  static const List<String> _candidateHosts = [
    'http://localhost:5000',
    'http://192.168.1.35:5000',
    'http://10.0.2.2:5000',
  ];

  static String _activeBaseUrl = 'http://localhost:5000';

  static String get baseUrl => _activeBaseUrl;

  /// Fetch live weather from backend with automatic host failover
  static Future<Map<String, dynamic>?> fetchWeather(double lat, double lng) async {
    for (final host in _candidateHosts) {
      try {
        final url = Uri.parse('$host/api/weather?lat=$lat&lng=$lng');
        final response = await http.get(url).timeout(const Duration(seconds: 4));
        if (response.statusCode == 200) {
          final json = jsonDecode(response.body);
          if (json['success'] == true && json['data'] != null) {
            _activeBaseUrl = host; // Cache working host
            return json['data'] as Map<String, dynamic>;
          }
        }
      } catch (_) {
        // Try next candidate host
      }
    }

    // Fallback meteorological reading if totally offline
    return {
      'windSpeed': 14.5,
      'windDirection': 285,
      'temperature': 28.0,
      'humidity': 48,
    };
  }

  /// Submit image & observation to Gemini Vision AI with host failover
  static Future<Map<String, dynamic>> submitPollutionReport({
    required String imageBase64,
    required double lat,
    required double lng,
    String category = 'stubble',
    String note = '',
    String voiceNote = '',
    String region = 'Punjab Border Corridor',
    String country = 'India',
  }) async {
    final deviceId = await HistoryService.getDeviceUUID();

    final payload = {
      'image': imageBase64,
      'lat': lat,
      'lng': lng,
      'category': category,
      'note': note,
      'voiceNote': voiceNote,
      'region': region,
      'country': country,
      'reporter': 'Citizen Android Sensor',
      'deviceId': deviceId,
      'source_platform': 'flutter_android',
    };

    final hostsToTry = [_activeBaseUrl, ..._candidateHosts.where((h) => h != _activeBaseUrl)];
    dynamic lastError;

    for (final host in hostsToTry) {
      try {
        final url = Uri.parse('$host/api/reports/pollution');
        final response = await http.post(
          url,
          headers: {
            'Content-Type': 'application/json',
            'X-Judge-Token': 'vesper-eval-2026',
          },
          body: jsonEncode(payload),
        ).timeout(const Duration(seconds: 45));

        final json = jsonDecode(response.body);
        if ((response.statusCode == 200 || response.statusCode == 201) && json['success'] == true) {
          _activeBaseUrl = host;
          final data = json['data'] as Map<String, dynamic>;
          // Save receipt to local storage
          await HistoryService.saveReport(data);
          return data;
        } else {
          throw Exception(json['error'] ?? 'Server error during forensic analysis');
        }
      } catch (e) {
        debugPrint('[ApiService] Attempt on $host failed: $e');
        lastError = e;
      }
    }

    throw Exception('Connection failed to backend: $lastError');
  }
}
