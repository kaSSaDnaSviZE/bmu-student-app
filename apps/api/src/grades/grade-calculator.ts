export interface GradeInput {
  weight: number;
  score: number | null;
  maxScore: number;
  isFinal: boolean;
}

export interface GradeSummary {
  currentPercent: number | null;
  finalPercent: number | null;
  completedWeight: number;
  earnedPoints: number;
}

export interface RequiredScore {
  requiredPercent: number | null;
  achievable: boolean;
  alreadyMet: boolean;
  message: string;
}

export function summarizeGrades(items: GradeInput[]): GradeSummary {
  const graded = items.filter((item) => item.score != null);
  const completedWeight = graded.reduce((sum, item) => sum + item.weight, 0);
  const earnedPoints = graded.reduce(
    (sum, item) => sum + ((item.score as number) / item.maxScore) * item.weight,
    0,
  );
  const currentPercent = completedWeight === 0 ? null : (earnedPoints / completedWeight) * 100;
  const allGraded = items.length > 0 && items.every((item) => item.score != null);
  const weightTotal = items.reduce((sum, item) => sum + item.weight, 0);
  const finalPercent =
    allGraded && weightTotal > 0 ? (earnedPoints / weightTotal) * 100 : null;
  return {
    currentPercent: currentPercent == null ? null : round1(currentPercent),
    finalPercent: finalPercent == null ? null : round1(finalPercent),
    completedWeight,
    earnedPoints: round1(earnedPoints),
  };
}

export function requiredScoreForTarget(items: GradeInput[], targetPercent: number): RequiredScore {
  if (!Number.isFinite(targetPercent) || targetPercent < 0 || targetPercent > 100) {
    return {
      requiredPercent: null,
      achievable: false,
      alreadyMet: false,
      message: 'Target must be between 0 and 100.',
    };
  }
  const finalItem = [...items].reverse().find((item) => item.isFinal);
  if (!finalItem) {
    return {
      requiredPercent: null,
      achievable: false,
      alreadyMet: false,
      message: 'This course has no final assessment to calculate against.',
    };
  }
  const others = items.filter((item) => item !== finalItem);
  if (others.some((item) => item.score == null)) {
    return {
      requiredPercent: null,
      achievable: false,
      alreadyMet: false,
      message: 'Enter or wait for every non-final score before calculating the final.',
    };
  }
  const earned = others.reduce(
    (sum, item) => sum + ((item.score as number) / item.maxScore) * item.weight,
    0,
  );
  const need = targetPercent - earned;
  if (need <= 0) {
    return {
      requiredPercent: 0,
      achievable: true,
      alreadyMet: true,
      message: `You already have enough points for ${targetPercent}. The final can be 0 and you still reach the target.`,
    };
  }
  const requiredRatio = need / finalItem.weight;
  const requiredPercent = round1(requiredRatio * 100);
  if (requiredPercent > 100) {
    return {
      requiredPercent,
      achievable: false,
      alreadyMet: false,
      message: `A score of ${requiredPercent} on the final would be required, which is above 100. ${targetPercent} is out of reach.`,
    };
  }
  return {
    requiredPercent,
    achievable: true,
    alreadyMet: false,
    message: `You need ${requiredPercent} on the final exam to finish with ${targetPercent}.`,
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
