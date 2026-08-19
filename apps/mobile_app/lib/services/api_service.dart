import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'history_service.dart';

class ApiService {
  // Default base URL: connects to local Express server via USB port reverse or local loopback
  static String get baseUrl {
    return 'http://localhost:5000';
  }

  /// Fetch live weather from backend
  static Future<Map<String, dynamic>?> fetchWeather(double lat, double lng) async {
    try {
      final url = Uri.parse('$baseUrl/api/weather?lat=$lat&lng=$lng');
      final response = await http.get(url).timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        if (json['success'] == true && json['data'] != null) {
          return json['data'] as Map<String, dynamic>;
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Weather fetch error: $e');
    }
    // Fallback meteorological reading
    return {
      'windSpeed': 14.5,
      'windDirection': 285,
      'temperature': 28.0,
      'humidity': 48,
    };
  }

  /// Submit image & observation to Gemini Vision AI with source_platform tag
  static Future<Map<String, dynamic>> submitPollutionReport({
    required String imageBase64,
    required double lat,
    required double lng,
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
      'note': note,
      'voiceNote': voiceNote,
      'region': region,
      'country': country,
      'reporter': 'Citizen Android Sensor',
      'deviceId': deviceId,
      'source_platform': 'flutter_android', // Explicit origin tag
    };

    final url = Uri.parse('$baseUrl/api/reports/pollution');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    ).timeout(const Duration(seconds: 15));

    final json = jsonDecode(response.body);
    if (response.statusCode == 201 && json['success'] == true) {
      final data = json['data'] as Map<String, dynamic>;
      // Save receipt to local storage
      await HistoryService.saveReport(data);
      return data;
    } else {
      throw Exception(json['error'] ?? 'Server error during forensic analysis');
    }
  }
}
