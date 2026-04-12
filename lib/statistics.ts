import type { AnalysisData, CorrelationResult, Session, StatsSummary } from "./types";

export function calculateStats(values: number[]): StatsSummary {
  const count = values.length;

  if (count === 0) {
    return { count: 0, mean: 0, stdDev: 0, min: 0, max: 0 };
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / count;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / count;

  return {
    count,
    mean: round(mean),
    stdDev: round(Math.sqrt(variance)),
    min: round(Math.min(...values)),
    max: round(Math.max(...values)),
  };
}

export function pearsonCorrelation(x: number[], y: number[]): number {
  const count = Math.min(x.length, y.length);

  if (count < 2) {
    return 0;
  }

  const xValues = x.slice(0, count);
  const yValues = y.slice(0, count);
  const xMean = xValues.reduce((sum, value) => sum + value, 0) / count;
  const yMean = yValues.reduce((sum, value) => sum + value, 0) / count;

  let covariance = 0;
  let xVariance = 0;
  let yVariance = 0;

  for (let index = 0; index < count; index += 1) {
    const xDiff = xValues[index] - xMean;
    const yDiff = yValues[index] - yMean;
    covariance += xDiff * yDiff;
    xVariance += xDiff * xDiff;
    yVariance += yDiff * yDiff;
  }

  const denominator = Math.sqrt(xVariance * yVariance);
  return denominator === 0 ? 0 : round(covariance / denominator);
}

function interpretCorrelation(r: number, n: number): string {
  const strength = Math.abs(r);
  const direction = r >= 0 ? "positive" : "negative";
  const sampleNote = n < 10 ? " Low sample size." : "";

  if (strength >= 0.7) {
    return `Strong ${direction} correlation (r=${r.toFixed(3)}).${sampleNote}`;
  }

  if (strength >= 0.4) {
    return `Moderate ${direction} correlation (r=${r.toFixed(3)}).${sampleNote}`;
  }

  if (strength >= 0.2) {
    return `Weak ${direction} correlation (r=${r.toFixed(3)}).${sampleNote}`;
  }

  return `Little to no linear correlation.${sampleNote}`;
}

export function generateAnalysisData(sessions: Session[]): AnalysisData {
  const emptyStats: StatsSummary = { count: 0, mean: 0, stdDev: 0, min: 0, max: 0 };

  if (sessions.length === 0) {
    return {
      sessions: [],
      stats: {
        sentimentScore: emptyStats,
        valence: emptyStats,
        arousal: emptyStats,
        heartRate: emptyStats,
        skinConductance: emptyStats,
      },
      correlations: [],
    };
  }

  const sentimentScores = sessions.map((session) => session.speech.sentimentScore);
  const valenceScores = sessions.map((session) => session.selfReport.valence);
  const arousalScores = sessions.map((session) => session.selfReport.arousal);
  const heartRates = sessions.map((session) => session.biometrics.heartRate);
  const skinConductance = sessions.map((session) => session.biometrics.skinConductance);
  const sampleSize = sessions.length;

  const pairs: Array<[string, string, number[], number[]]> = [
    ["AI Sentiment", "Valence", sentimentScores, valenceScores],
    ["AI Sentiment", "Heart Rate", sentimentScores, heartRates],
    ["AI Sentiment", "Arousal", sentimentScores, arousalScores],
    ["Valence", "Heart Rate", valenceScores, heartRates],
    ["Arousal", "Heart Rate", arousalScores, heartRates],
    ["Arousal", "Skin Conductance", arousalScores, skinConductance],
  ];

  const correlations: CorrelationResult[] = pairs.map(([variableX, variableY, x, y]) => {
    const r = pearsonCorrelation(x, y);

    return {
      variableX,
      variableY,
      r,
      n: sampleSize,
      interpretation: interpretCorrelation(r, sampleSize),
    };
  });

  return {
    sessions,
    stats: {
      sentimentScore: calculateStats(sentimentScores),
      valence: calculateStats(valenceScores),
      arousal: calculateStats(arousalScores),
      heartRate: calculateStats(heartRates),
      skinConductance: calculateStats(skinConductance),
    },
    correlations,
  };
}

export function normalize(values: number[]): number[] {
  if (values.length === 0) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  if (range === 0) {
    return values.map(() => 0.5);
  }

  return values.map((value) => (value - min) / range);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
