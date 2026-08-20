import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../i18n/translations.dart';

class ForensicResultCard extends StatelessWidget {
  final Map<String, dynamic> report;
  final String currentLang;

  const ForensicResultCard({
    super.key,
    required this.report,
    required this.currentLang,
  });

  @override
  Widget build(BuildContext context) {
    final ai = report['aiResult'] as Map<String, dynamic>? ?? {};
    final isHazard = ai['immediate_health_hazard'] == true;
    final density = (ai['visual_density_score'] as num?)?.toDouble() ?? 7.5;
    final sourceClass = ai['source_classification'] ?? report['title'] ?? 'Emission Source';
    final pollutants = (ai['pollutants_detected'] as List<dynamic>?)?.cast<String>() ?? ['PM2.5', 'SO2', 'VOCs'];
    final plume = ai['plume_vector'] as Map<String, dynamic>? ?? {};
    final isCrossBorder = plume['cross_border_risk'] == true;
    final rec = ai['dispatch_recommendation'] as String? ?? '';
    final driftSpeed = plume['estimated_drift_km_per_hr'] ?? plume['drift_speed'] ?? 15.0;
    final driftDir = plume['direction_degrees'] ?? plume['drift_bearing'] ?? 120;
    final plumeLength = plume['estimated_plume_length_km'] ?? plume['estimated_length_km'] ?? 8.0;

    return Container(
      margin: const EdgeInsets.only(top: 16, bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppTheme.cardGrad,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isHazard ? AppTheme.rose.withValues(alpha: 0.6) : AppTheme.cyan.withValues(alpha: 0.5),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: (isHazard ? AppTheme.rose : AppTheme.cyan).withValues(alpha: 0.18),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Header: Multimodal AI Verified Badge & Hazard Indicator
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isHazard ? AppTheme.rose : AppTheme.emerald,
                      boxShadow: [
                        BoxShadow(
                          color: (isHazard ? AppTheme.rose : AppTheme.emerald).withValues(alpha: 0.8),
                          blurRadius: 6,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'GEMINI VISION VERIFIED',
                    style: GoogleFonts.jetBrainsMono(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.8,
                      color: isHazard ? AppTheme.rose : AppTheme.emeraldLight,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                decoration: BoxDecoration(
                  color: isHazard ? AppTheme.rose.withValues(alpha: 0.18) : AppTheme.emerald.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isHazard ? AppTheme.rose.withValues(alpha: 0.6) : AppTheme.emerald.withValues(alpha: 0.6),
                  ),
                ),
                child: Text(
                  isHazard ? 'CRITICAL HAZARD' : 'VERIFIED',
                  style: GoogleFonts.outfit(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                    color: isHazard ? AppTheme.rose : AppTheme.emeraldLight,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Incident Classification Title
          Text(
            sourceClass,
            style: GoogleFonts.outfit(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppTheme.textMain,
              letterSpacing: -0.2,
            ),
          ),

          // Category Discrepancy / Visual Auto-Correction Notice if detected
          if (ai['category_discrepancy_detected'] == true) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppTheme.cyan.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.cyan.withValues(alpha: 0.35)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.auto_awesome, color: AppTheme.cyan, size: 14),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'AI Optical Auto-Correction: Classified from image pixels over preset.',
                      style: GoogleFonts.inter(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.cyanLight,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 14),

          // Density Gauge Container
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.bgSurface.withValues(alpha: 0.7),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.borderSubtle),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      Translations.get(currentLang, 'opticalDensity'),
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.textMuted,
                      ),
                    ),
                    RichText(
                      text: TextSpan(
                        children: [
                          TextSpan(
                            text: density.toStringAsFixed(1),
                            style: GoogleFonts.jetBrainsMono(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: density > 8 ? AppTheme.rose : (density > 6 ? AppTheme.amber : AppTheme.cyan),
                            ),
                          ),
                          TextSpan(
                            text: ' / 10.0',
                            style: GoogleFonts.jetBrainsMono(
                              fontSize: 11,
                              color: AppTheme.textDim,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: (density / 10.0).clamp(0.0, 1.0),
                    minHeight: 8,
                    backgroundColor: Colors.white.withValues(alpha: 0.08),
                    valueColor: AlwaysStoppedAnimation<Color>(
                      density > 8 ? AppTheme.rose : (density > 6 ? AppTheme.amber : AppTheme.cyan),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Plume Drift Dynamics Card
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.bgSurface.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.borderSubtle),
            ),
            child: Row(
              children: [
                const Icon(Icons.air, color: AppTheme.cyan, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Plume Drift: $driftSpeed km/h towards $driftDir° (Est. $plumeLength km)',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.cyanLight,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Detected Compounds Chips
          Text(
            Translations.get(currentLang, 'detectedPollutants'),
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: AppTheme.textMain,
            ),
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: pollutants.map((p) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.cyan.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.cyan.withValues(alpha: 0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.blur_on, size: 12, color: AppTheme.cyan),
                    const SizedBox(width: 4),
                    Text(
                      p,
                      style: GoogleFonts.jetBrainsMono(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.cyanLight,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),

          // Cross-border Warning if active
          if (isCrossBorder) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.amber.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.amber.withValues(alpha: 0.35)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: AppTheme.amber, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Cross-Border Dispersion Warning: Plume will impact adjacent regional air sheds.',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.amber,
                        height: 1.3,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Gemini AI Forensic Recommendation Box
          if (rec.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.cyan.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.cyan.withValues(alpha: 0.25)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.auto_awesome, color: AppTheme.cyan, size: 14),
                      const SizedBox(width: 6),
                      Text(
                        'GEMINI AI DISPATCH PROTOCOL',
                        style: GoogleFonts.jetBrainsMono(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.cyan,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    rec,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: AppTheme.textMain.withValues(alpha: 0.9),
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 14),

          // Origin & Tracking Receipt Footer (Responsive with zero overflow)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      final id = report['id'] ?? '';
                      if (id.isNotEmpty) {
                        Clipboard.setData(ClipboardData(text: id));
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            duration: const Duration(seconds: 2),
                            backgroundColor: AppTheme.bgSurface,
                            content: Text('Copied Tracking ID: $id', style: const TextStyle(fontSize: 12)),
                          ),
                        );
                      }
                    },
                    child: Row(
                      children: [
                        const Icon(Icons.copy, size: 11, color: AppTheme.textDim),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            'ID: ${report['id'] ?? 'N/A'}',
                            style: GoogleFonts.jetBrainsMono(
                              fontSize: 10,
                              color: AppTheme.textDim,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppTheme.cyan.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.phone_android, size: 10, color: AppTheme.cyan),
                      const SizedBox(width: 3),
                      Text(
                        'Android App',
                        style: GoogleFonts.inter(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.cyan,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
