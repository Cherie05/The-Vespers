import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/main.dart';

void main() {
  testWidgets('VesperAero Mobile App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const VesperAeroMobileApp());
    expect(find.text('VesperAero'), findsOneWidget);
    expect(find.text('BRICS Climate Action'), findsOneWidget);
  });
}

