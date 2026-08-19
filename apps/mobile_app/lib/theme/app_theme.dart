import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand Color Palette
  static const Color bgDark = Color(0xFF070B14);
  static const Color bgSurface = Color(0xFF0F172A);
  static const Color bgCard = Color(0xFF131D34);
  static const Color bgCardHover = Color(0xFF1E293B);

  static const Color cyan = Color(0xFF38BDF8);
  static const Color cyanLight = Color(0xFF7DD3FC);
  static const Color emerald = Color(0xFF10B981);
  static const Color emeraldLight = Color(0xFF34D399);
  static const Color rose = Color(0xFFFB7185);
  static const Color amber = Color(0xFFF59E0B);
  static const Color indigo = Color(0xFF818CF8);

  static const Color textMain = Color(0xFFF8FAFC);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color textDim = Color(0xFF64748B);

  static const Color borderSubtle = Color(0x1AFFFFFF);
  static const Color borderAccent = Color(0x3338BDF8);
  static const Color borderHazard = Color(0x66FB7185);

  // Glassmorphic Gradients
  static const LinearGradient primaryGrad = LinearGradient(
    colors: [cyan, indigo, emerald],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cardGrad = LinearGradient(
    colors: [Color(0xFF131D34), Color(0xFF0E1627)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient buttonGrad = LinearGradient(
    colors: [Color(0xFF38BDF8), Color(0xFF0284C7)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: bgDark,
      primaryColor: cyan,
      colorScheme: const ColorScheme.dark(
        primary: cyan,
        secondary: emerald,
        surface: bgSurface,
        error: rose,
      ),
      textTheme: GoogleFonts.interTextTheme(
        ThemeData.dark().textTheme,
      ).apply(
        bodyColor: textMain,
        displayColor: textMain,
      ),
      cardTheme: CardThemeData(
        color: bgCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: borderSubtle),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: cyan,
          foregroundColor: const Color(0xFF070B14),
          elevation: 4,
          shadowColor: cyan.withValues(alpha: 0.4),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.outfit(
            fontWeight: FontWeight.w800,
            fontSize: 15,
            letterSpacing: 0.3,
          ),
        ),
      ),
    );
  }
}
