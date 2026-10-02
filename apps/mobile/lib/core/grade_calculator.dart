class GradePart {
  const GradePart({
    required this.weight,
    required this.score,
    required this.maxScore,
    required this.isFinal,
  });

  final int weight;
  final double? score;
  final double maxScore;
  final bool isFinal;
}

class RequiredScore {
  const RequiredScore({
    required this.requiredPercent,
    required this.achievable,
    required this.alreadyMet,
    required this.message,
  });

  final double? requiredPercent;
  final bool achievable;
  final bool alreadyMet;
  final String message;
}

RequiredScore requiredScoreForTarget(List<GradePart> items, double targetPercent) {
  if (targetPercent < 0 || targetPercent > 100) {
    return const RequiredScore(
      requiredPercent: null,
      achievable: false,
      alreadyMet: false,
      message: 'Target must be between 0 and 100.',
    );
  }
  final finals = items.where((item) => item.isFinal);
  if (finals.isEmpty) {
    return const RequiredScore(
      requiredPercent: null,
      achievable: false,
      alreadyMet: false,
      message: 'This course has no final assessment.',
    );
  }
  final finalItem = finals.last;
  final others = items.where((item) => !identical(item, finalItem)).toList();
  if (others.any((item) => item.score == null)) {
    return const RequiredScore(
      requiredPercent: null,
      achievable: false,
      alreadyMet: false,
      message: 'Every non-final score is needed before this can be calculated.',
    );
  }
  final earned = others.fold<double>(
    0,
    (sum, item) => sum + (item.score! / item.maxScore) * item.weight,
  );
  final need = targetPercent - earned;
  if (need <= 0) {
    return RequiredScore(
      requiredPercent: 0,
      achievable: true,
      alreadyMet: true,
      message: 'You already have enough points for ${targetPercent.toStringAsFixed(0)}.',
    );
  }
  final requiredPercent = double.parse(((need / finalItem.weight) * 100).toStringAsFixed(1));
  if (requiredPercent > 100) {
    return RequiredScore(
      requiredPercent: requiredPercent,
      achievable: false,
      alreadyMet: false,
      message: 'A score of $requiredPercent would be required. $targetPercent is out of reach.',
    );
  }
  return RequiredScore(
    requiredPercent: requiredPercent,
    achievable: true,
    alreadyMet: false,
    message: 'You need $requiredPercent on the final exam to finish with ${targetPercent.toStringAsFixed(0)}.',
  );
}
