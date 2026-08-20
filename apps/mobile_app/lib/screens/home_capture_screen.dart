import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../i18n/translations.dart';
import '../services/api_service.dart';
import '../services/history_service.dart';
import '../widgets/forensic_result_card.dart';
import '../widgets/history_drawer.dart';

class HomeCaptureScreen extends StatefulWidget {
  const HomeCaptureScreen({super.key});

  @override
  State<HomeCaptureScreen> createState() => _HomeCaptureScreenState();
}

class _HomeCaptureScreenState extends State<HomeCaptureScreen> {
  String _currentLang = 'en';
  String? _selectedImageBase64;
  String _selectedCategory = 'stubble'; // Observation category (does NOT change GPS)
  final TextEditingController _noteController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  double _lat = 31.6340;
  double _lng = 74.8723;
  bool _isLiveGPS = false;
  bool _isLocating = false;
  Map<String, dynamic>? _weather;
  Timer? _weatherTimer;

  bool _isAnalyzing = false;
  int _analysisStage = 0; // 0: GPS/Weather, 1: Visual Opacity, 2: Gemini Forensics
  Map<String, dynamic>? _analysisResult;
  int _historyCount = 0;

  Uint8List? _previewImageBytes;
  static const String _mockPresetImage =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  @override
  void initState() {
    super.initState();
    _selectedImageBase64 = _mockPresetImage;
    _requestAndAcquireLiveLocation(auto: true);
    _updateHistoryCount();

    // Real-time meteorological refresh every 60 seconds from Open-Meteo
    _weatherTimer = Timer.periodic(const Duration(seconds: 60), (_) {
      _fetchWeather();
    });
  }

  @override
  void dispose() {
    _weatherTimer?.cancel();
    _noteController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  /// Request runtime location permissions from Android OS and lock onto physical satellite GPS
  Future<void> _requestAndAcquireLiveLocation({bool auto = false}) async {
    setState(() {
      _isLocating = true;
    });

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (!auto && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please enable GPS location services in device settings')),
          );
        }
        _useFallbackLocation();
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (!auto && mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Location permission denied. Using standard hotspot coordinates.')),
            );
          }
          _useFallbackLocation();
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (!auto && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Location permissions permanently denied. Enable in App Settings.')),
          );
        }
        _useFallbackLocation();
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 8),
      );

      if (mounted) {
        setState(() {
          _lat = double.parse(position.latitude.toStringAsFixed(4));
          _lng = double.parse(position.longitude.toStringAsFixed(4));
          _isLiveGPS = true;
          _isLocating = false;
        });

        // Immediately fetch real-world live wind & atmospheric telemetry for this physical GPS coordinate
        await _fetchWeather();

        if (!auto && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: AppTheme.emerald,
              content: Text('🟢 Live Satellite GPS Locked: $_lat, $_lng'),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('[GPS] Error acquiring live position: $e');
      _useFallbackLocation();
    }
  }

  void _useFallbackLocation() {
    if (mounted) {
      setState(() {
        _isLocating = false;
        if (!_isLiveGPS) {
          _lat = 31.6340;
          _lng = 74.8723;
        }
      });
      _fetchWeather();
    }
  }

  Future<void> _fetchWeather() async {
    final w = await ApiService.fetchWeather(_lat, _lng);
    if (mounted) {
      setState(() {
        _weather = w;
      });
    }
  }

  Future<void> _updateHistoryCount() async {
    final reports = await HistoryService.getReports();
    if (mounted) {
      setState(() {
        _historyCount = reports.length;
      });
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: source,
        maxWidth: 900,
        maxHeight: 900,
        imageQuality: 70,
      );
      if (picked != null) {
        final bytes = await picked.readAsBytes();
        setState(() {
          _previewImageBytes = bytes;
          _selectedImageBase64 = 'data:image/jpeg;base64,${base64Encode(bytes)}';
        });
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
    }
  }

  Future<void> _handleAnalyze() async {
    if (_selectedImageBase64 == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select or capture an image first')),
      );
      return;
    }

    FocusScope.of(context).unfocus();

    setState(() {
      _isAnalyzing = true;
      _analysisStage = 0;
      _analysisResult = null;
    });

    // Animated telemetry progression
    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted && _isAnalyzing) setState(() => _analysisStage = 1);
    });
    Future.delayed(const Duration(milliseconds: 1400), () {
      if (mounted && _isAnalyzing) setState(() => _analysisStage = 2);
    });

    try {
      final result = await ApiService.submitPollutionReport(
        imageBase64: _selectedImageBase64!,
        lat: _lat,
        lng: _lng,
        category: _selectedCategory,
        note: _noteController.text.trim(),
        region: _isLiveGPS ? 'Physical GPS Sensor Region' : 'Punjab Border Corridor',
        country: 'India',
      );

      if (mounted) {
        setState(() {
          _analysisResult = result;
          _isAnalyzing = false;
        });
        _updateHistoryCount();
        Future.delayed(const Duration(milliseconds: 300), () {
          if (mounted && _scrollController.hasClients) {
            _scrollController.animateTo(
              _scrollController.position.maxScrollExtent,
              duration: const Duration(milliseconds: 600),
              curve: Curves.easeOutCubic,
            );
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isAnalyzing = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.rose,
            content: Text('Submission error: $e'),
          ),
        );
      }
    }
  }

  void _openHistoryDrawer() {
    FocusScope.of(context).unfocus();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return FractionallySizedBox(
          heightFactor: 0.85,
          child: HistoryDrawer(
            currentLang: _currentLang,
            onClose: () {
              Navigator.pop(context);
              _updateHistoryCount();
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: AppTheme.bgSurface,
          elevation: 0,
          titleSpacing: 16,
          title: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.cyan.withValues(alpha: 0.4)),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.cyan.withValues(alpha: 0.35),
                      blurRadius: 10,
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(9),
                  child: Image.asset('assets/icon.png', fit: BoxFit.cover),
                ),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    Translations.get(_currentLang, 'appTitle'),
                    style: GoogleFonts.outfit(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textMain,
                      letterSpacing: -0.2,
                    ),
                  ),
                  Row(
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _isLiveGPS ? AppTheme.emerald : AppTheme.cyan,
                          boxShadow: [
                            BoxShadow(
                              color: (_isLiveGPS ? AppTheme.emerald : AppTheme.cyan).withValues(alpha: 0.8),
                              blurRadius: 4,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        _isLiveGPS ? 'LIVE SATELLITE GPS' : Translations.get(_currentLang, 'bricsBadge'),
                        style: GoogleFonts.jetBrainsMono(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: _isLiveGPS ? AppTheme.emeraldLight : AppTheme.cyanLight,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          actions: [
            // History Submissions Button
            TextButton.icon(
              onPressed: _openHistoryDrawer,
              icon: const Icon(Icons.history, size: 16, color: AppTheme.cyan),
              label: Text(
                _historyCount > 0 ? '$_historyCount' : Translations.get(_currentLang, 'historyTitle'),
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.cyan,
                ),
              ),
            ),
            // Multi-language Dropdown
            DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _currentLang,
                dropdownColor: AppTheme.bgSurface,
                icon: const Icon(Icons.language, size: 18, color: AppTheme.textMuted),
                items: const [
                  DropdownMenuItem(value: 'en', child: Text('EN', style: TextStyle(fontSize: 12))),
                  DropdownMenuItem(value: 'hi', child: Text('हिन्दी', style: TextStyle(fontSize: 12))),
                  DropdownMenuItem(value: 'pt', child: Text('PT', style: TextStyle(fontSize: 12))),
                  DropdownMenuItem(value: 'ru', child: Text('РУ', style: TextStyle(fontSize: 12))),
                  DropdownMenuItem(value: 'zh', child: Text('中文', style: TextStyle(fontSize: 12))),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setState(() {
                      _currentLang = val;
                    });
                  }
                },
              ),
            ),
            const SizedBox(width: 10),
          ],
        ),
        body: SingleChildScrollView(
          controller: _scrollController,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hero Heading
              Text(
                Translations.get(_currentLang, 'captureTitle'),
                style: GoogleFonts.outfit(
                  fontSize: 21,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textMain,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                Translations.get(_currentLang, 'captureSubtitle'),
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: AppTheme.textMuted,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 14),

              // Live Real-Time Telemetry Bar (GPS + Open-Meteo Wind Vector)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: AppTheme.cardGrad,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: _isLiveGPS ? AppTheme.emerald.withValues(alpha: 0.6) : AppTheme.borderAccent,
                    width: 1.2,
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // GPS Section (Tap to re-lock / refresh live GPS satellites)
                        Expanded(
                          child: GestureDetector(
                            onTap: () => _requestAndAcquireLiveLocation(),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(7),
                                  decoration: BoxDecoration(
                                    color: (_isLiveGPS ? AppTheme.emerald : AppTheme.cyan).withValues(alpha: 0.18),
                                    shape: BoxShape.circle,
                                  ),
                                  child: _isLocating
                                      ? const SizedBox(
                                          width: 14,
                                          height: 14,
                                          child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.cyan),
                                        )
                                      : Icon(
                                          _isLiveGPS ? Icons.my_location : Icons.gps_fixed,
                                          color: _isLiveGPS ? AppTheme.emerald : AppTheme.cyan,
                                          size: 14,
                                        ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Text(
                                            _isLiveGPS ? '🟢 LIVE GPS LOCKED' : Translations.get(_currentLang, 'gpsLocked'),
                                            style: GoogleFonts.inter(
                                              fontSize: 10,
                                              color: _isLiveGPS ? AppTheme.emeraldLight : AppTheme.textDim,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                          const SizedBox(width: 4),
                                          if (!_isLiveGPS)
                                            const Icon(Icons.touch_app, size: 10, color: AppTheme.cyan),
                                        ],
                                      ),
                                      Text(
                                        '$_lat, $_lng',
                                        style: GoogleFonts.jetBrainsMono(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.textMain,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        // Open-Meteo Real-time Wind Telemetry Section (Tap to refresh)
                        GestureDetector(
                          onTap: _fetchWeather,
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(7),
                                decoration: BoxDecoration(
                                  color: AppTheme.cyan.withValues(alpha: 0.15),
                                  shape: BoxShape.circle,
                                ),
                                child: Transform.rotate(
                                  angle: ((_weather?['windDirection'] ?? 285) * 3.14159 / 180),
                                  child: const Icon(Icons.navigation, color: AppTheme.cyan, size: 14),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        Translations.get(_currentLang, 'windVector'),
                                        style: GoogleFonts.inter(
                                          fontSize: 10,
                                          color: AppTheme.textDim,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      const SizedBox(width: 3),
                                      const Icon(Icons.refresh, size: 9, color: AppTheme.textDim),
                                    ],
                                  ),
                                  Text(
                                    '${_weather?['windSpeed'] ?? 14.5} km/h @ ${_weather?['windDirection'] ?? 285}°',
                                    style: GoogleFonts.jetBrainsMono(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.cyanLight,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Emission Observation Categories (Does NOT change GPS coordinates)
              Text(
                'Emission Observation Category',
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textDim,
                ),
              ),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildCategoryChip('stubble', Translations.get(_currentLang, 'stubblePreset'), Icons.agriculture),
                    const SizedBox(width: 8),
                    _buildCategoryChip('industrial', Translations.get(_currentLang, 'industrialPreset'), Icons.factory),
                    const SizedBox(width: 8),
                    _buildCategoryChip('kiln', Translations.get(_currentLang, 'kilnPreset'), Icons.fireplace),
                    const SizedBox(width: 8),
                    _buildCategoryChip('chemical', '☣️ Chemical Flare', Icons.warning_amber_rounded),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Optical Evidence Box
              Container(
                height: 200,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppTheme.bgCard,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: _previewImageBytes != null ? AppTheme.cyan : AppTheme.borderAccent,
                    width: 1.5,
                  ),
                  boxShadow: [
                    if (_previewImageBytes != null)
                      BoxShadow(
                        color: AppTheme.cyan.withValues(alpha: 0.15),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                  ],
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    if (_previewImageBytes != null)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12.5),
                        child: Image.memory(
                          _previewImageBytes!,
                          width: double.infinity,
                          height: 200,
                          fit: BoxFit.cover,
                        ),
                      )
                    else
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.camera_alt_outlined,
                            size: 42,
                            color: AppTheme.cyan,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Category: $_selectedCategory',
                            style: GoogleFonts.outfit(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textMain,
                            ),
                          ),
                          Text(
                            'Ready for Multimodal Gemini Vision AI',
                            style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textDim),
                          ),
                        ],
                      ),
                    // Change / Clear Photo Pill when photo is selected
                    if (_previewImageBytes != null)
                      Positioned(
                        top: 10,
                        right: 10,
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _previewImageBytes = null;
                              _selectedImageBase64 = null;
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.7),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: Colors.white24),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.close, size: 12, color: Colors.white70),
                                const SizedBox(width: 3),
                                Text(
                                  'Clear',
                                  style: GoogleFonts.inter(fontSize: 10, color: Colors.white),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    Positioned(
                      bottom: 10,
                      right: 10,
                      child: Row(
                        children: [
                          ElevatedButton.icon(
                            onPressed: () => _pickImage(ImageSource.gallery),
                            icon: const Icon(Icons.photo_library, size: 14),
                            label: const Text('Gallery', style: TextStyle(fontSize: 11)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.bgSurface.withValues(alpha: 0.9),
                              foregroundColor: AppTheme.cyan,
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              side: const BorderSide(color: AppTheme.borderSubtle),
                              elevation: 2,
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton.icon(
                            onPressed: () => _pickImage(ImageSource.camera),
                            icon: const Icon(Icons.camera_alt, size: 14),
                            label: const Text('Camera', style: TextStyle(fontSize: 11)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.cyan,
                              foregroundColor: const Color(0xFF070B14),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              elevation: 2,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Field Observation Input
              TextField(
                controller: _noteController,
                maxLines: 2,
                textInputAction: TextInputAction.done,
                style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textMain),
                decoration: InputDecoration(
                  hintText: Translations.get(_currentLang, 'observationHint'),
                  hintStyle: GoogleFonts.inter(fontSize: 12, color: AppTheme.textDim),
                  filled: true,
                  fillColor: AppTheme.bgSurface,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppTheme.borderSubtle),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppTheme.borderSubtle),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppTheme.cyan),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Primary Action Button with Animated Multi-stage Loading
              Container(
                width: double.infinity,
                height: 52,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  gradient: AppTheme.buttonGrad,
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.cyan.withValues(alpha: 0.35),
                      blurRadius: 14,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: ElevatedButton(
                  onPressed: _isAnalyzing ? null : _handleAnalyze,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isAnalyzing
                      ? Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2.2, color: Color(0xFF070B14)),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              _analysisStage == 0
                                  ? '1/3 Syncing GPS & Weather...'
                                  : _analysisStage == 1
                                      ? '2/3 Scanning Optical Density...'
                                      : '3/3 Querying Gemini AI...',
                              style: GoogleFonts.outfit(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF070B14),
                              ),
                            ),
                          ],
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.auto_awesome, size: 18, color: Color(0xFF070B14)),
                            const SizedBox(width: 8),
                            Text(
                              Translations.get(_currentLang, 'analyzeBtn'),
                              style: GoogleFonts.outfit(
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF070B14),
                              ),
                            ),
                          ],
                        ),
                ),
              ),

              // Forensic Analysis Result Card
              if (_analysisResult != null)
                ForensicResultCard(
                  report: _analysisResult!,
                  currentLang: _currentLang,
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryChip(String key, String label, IconData icon) {
    final isSelected = _selectedCategory == key;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedCategory = key;
          if (_previewImageBytes == null) {
            _selectedImageBase64 = _mockPresetImage;
          }
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.cyan.withValues(alpha: 0.18) : AppTheme.bgSurface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppTheme.cyan : AppTheme.borderSubtle,
            width: 1.2,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 14,
              color: isSelected ? AppTheme.cyan : AppTheme.textMuted,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                color: isSelected ? AppTheme.cyan : AppTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
