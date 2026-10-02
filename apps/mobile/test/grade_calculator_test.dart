import 'package:bmu_student_app/core/grade_calculator.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('matches the programming example: 82.5 to finish with 85', () {
    final result = requiredScoreForTarget(const [
      GradePart(weight: 10, score: 88, maxScore: 100, isFinal: false),
      GradePart(weight: 20, score: 90, maxScore: 100, isFinal: false),
      GradePart(weight: 30, score: 84, maxScore: 100, isFinal: false),
      GradePart(weight: 40, score: null, maxScore: 100, isFinal: true),
    ], 85);
    expect(result.achievable, isTrue);
    expect(result.requiredPercent, 82.5);
    expect(result.message, contains('82.5'));
  });
}
