import 'dart:convert';
import 'dart:math';
import 'package:shared_preferences/shared_preferences.dart';

class HistoryService {
  static const String _uuidKey = 'vesperaero_device_uuid';
  static const String _historyKey = 'vesperaero_user_reports';

  /// Get or create anonymous device UUID
  static Future<String> getDeviceUUID() async {
    final prefs = await SharedPreferences.getInstance();
    String? uuid = prefs.getString(_uuidKey);
    if (uuid == null) {
      final randomStr = Random().nextInt(0xFFFFFF).toRadixString(16).padLeft(6, '0');
      uuid = 'dev_${DateTime.now().millisecondsSinceEpoch}_$randomStr';
      await prefs.setString(_uuidKey, uuid);
    }
    return uuid;
  }

  /// Save report receipt locally
  static Future<void> saveReport(Map<String, dynamic> report) async {
    final prefs = await SharedPreferences.getInstance();
    final List<String> existing = prefs.getStringList(_historyKey) ?? [];
    
    // Add new report at the front
    existing.insert(0, jsonEncode(report));
    
    // Keep max 100 reports
    if (existing.length > 100) {
      existing.removeRange(100, existing.length);
    }
    
    await prefs.setStringList(_historyKey, existing);
  }

  /// Retrieve all local report receipts
  static Future<List<Map<String, dynamic>>> getReports() async {
    final prefs = await SharedPreferences.getInstance();
    final List<String> raw = prefs.getStringList(_historyKey) ?? [];
    return raw.map((item) => jsonDecode(item) as Map<String, dynamic>).toList();
  }

  /// Clear all receipts
  static Future<void> clearHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_historyKey);
  }
}
