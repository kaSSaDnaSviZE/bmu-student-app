import { requiredScoreForTarget, summarizeGrades } from './grade-calculator';

const programming = [
  { weight: 10, score: 88, maxScore: 100, isFinal: false },
  { weight: 20, score: 90, maxScore: 100, isFinal: false },
  { weight: 30, score: 84, maxScore: 100, isFinal: false },
  { weight: 40, score: null, maxScore: 100, isFinal: true },
];

describe('grade calculator', () => {
  it('reports the running average of completed work', () => {
    const summary = summarizeGrades(programming);
    expect(summary.currentPercent).toBe(86.7);
    expect(summary.finalPercent).toBeNull();
    expect(summary.earnedPoints).toBe(52);
  });

  it('answers what score is needed on the final for an 85', () => {
    const result = requiredScoreForTarget(programming, 85);
    expect(result.achievable).toBe(true);
    expect(result.requiredPercent).toBe(82.5);
    expect(result.message).toContain('82.5');
    expect(result.message).toContain('85');
  });

  it('marks an impossible target', () => {
    const result = requiredScoreForTarget(programming, 99);
    expect(result.achievable).toBe(false);
  });

  it('marks a target that is already secured', () => {
    const result = requiredScoreForTarget(programming, 50);
    expect(result.alreadyMet).toBe(true);
  });
});
