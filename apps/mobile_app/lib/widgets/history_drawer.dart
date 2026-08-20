import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../services/history_service.dart';
import '../i18n/translations.dart';

class HistoryDrawer extends StatefulWidget {
  final String currentLang;
  final VoidCallback onClose;

  const HistoryDrawer({
    super.key,
    required this.currentLang,
    required this.onClose,
  });

  @override
  State<HistoryDrawer> createState() => _HistoryDrawerState();
}

class _HistoryDrawerState extends State<HistoryDrawer> {
  List<Map<String, dynamic>> _reports = [];
  String _uuid = '';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final uuid = await HistoryService.getDeviceUUID();
    final reports = await HistoryService.getReports();
    if (mounted) {
      setState(() {
        _uuid = uuid;
        _reports = reports;
        _isLoading = false;
      });
    }
  }

  void _copyUUID() {
    Clipboard.setData(ClipboardData(text: _uuid));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Anonymous Device UUID copied to clipboard'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.bgDark,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.fromLTRB(18, 20, 18, 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drawer Pull Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: AppTheme.cyan.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.history, color: AppTheme.cyan, size: 20),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    Translations.get(widget.currentLang, 'historyTitle'),
                    style: GoogleFonts.outfit(
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textMain,
                    ),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close, color: AppTheme.textMuted),
                onPressed: widget.onClose,
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Anonymous Device UUID Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.bgSurface,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.borderSubtle),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      const Icon(Icons.fingerprint, size: 16, color: AppTheme.cyan),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'UUID: $_uuid',
                          style: GoogleFonts.jetBrainsMono(
                            fontSize: 11,
                            color: AppTheme.textDim,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: _copyUUID,
                  child: const Icon(Icons.copy, size: 14, color: AppTheme.textMuted),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Receipts List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.cyan))
                : _reports.isEmpty
                    ? Center(
                        child: Text(
                          Translations.get(widget.currentLang, 'noHistory'),
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(color: AppTheme.textDim, fontSize: 13),
                        ),
                      )
                    : ListView.separated(
                        itemCount: _reports.length,
                        separatorBuilder: (context, idx) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final report = _reports[index];
                          final status = (report['status'] ?? 'verified').toString().toLowerCase();
                          final isDispatched = status == 'dispatched';

                          return Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              gradient: AppTheme.cardGrad,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppTheme.borderSubtle),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        report['title'] ?? 'Incident Report',
                                        style: GoogleFonts.outfit(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.textMain,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: isDispatched
                                            ? AppTheme.emerald.withValues(alpha: 0.18)
                                            : AppTheme.cyan.withValues(alpha: 0.18),
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(
                                          color: isDispatched
                                              ? AppTheme.emerald.withValues(alpha: 0.5)
                                              : AppTheme.cyan.withValues(alpha: 0.5),
                                        ),
                                      ),
                                      child: Text(
                                        isDispatched ? 'DISPATCHED' : 'VERIFIED',
                                        style: GoogleFonts.jetBrainsMono(
                                          fontSize: 9,
                                          fontWeight: FontWeight.w800,
                                          color: isDispatched ? AppTheme.emeraldLight : AppTheme.cyanLight,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      report['region'] ?? 'Punjab Corridor',
                                      style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
                                    ),
                                    Text(
                                      report['timestamp']?.toString().substring(0, 10) ?? '',
                                      style: GoogleFonts.jetBrainsMono(fontSize: 10, color: AppTheme.textDim),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
