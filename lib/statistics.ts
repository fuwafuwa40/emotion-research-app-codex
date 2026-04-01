import type { Session, StatsSummary, CorrelationResult, AnalysisData } from "./types";
export function calculateStats(values: number[]): StatsSummary {
  const n = values.length;
  if (n === 0) return { count: 0, mean: 0, stdDev: 0, min: 0, max: 0 };
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  return { count: n, mean: Math.round(mean * 1000) / 1000, stdDev: Math.round(Math.sqrt(variance) * 1000) / 1000, min: Math.round(Math.min(...values) * 1000) / 1000, max: Math.round(Math.max(...values) * 1000) / 1000 };
}
export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const mx = x.slice(0, n).reduce((s, v) => s + v, 0) / n;
  const my = y.slice(0, n).reduce((s, v) => s + v, 0) / n;
  let sxy = 0, sx2 = 0, sy2 = 0;
  for (let i = 0; i < n; i++) { const dx = x[i] - mx, dy = y[i] - my; sxy += dx * dy; sx2 += dx * dx; sy2 += dy * dy; }
  const d = Math.sqrt(sx2 * sy2);
  return d === 0 ? 0 : Math.round((sxy / d) * 1000) / 1000;
}
function interpretCorrelation(r: number, n: number): string {
  const a = Math.abs(r); const dir = r >= 0 ? "正の" : "負の"; const note = n < 10 ? "（参考値）" : "";
  if (a >= 0.7) return "強い" + dir + "相関 (r=" + r + ")" + note;
  if (a >= 0.4) return "中程度の" + dir + "相関 (r=" + r + ")" + note;
  if (a >= 0.2) return "弱い" + dir + "相関 (r=" + r + ")" + note;
  return "相関はほぼ無い" + note;
}
export function generateAnalysisData(sessions: Session[]): AnalysisData {
  const empty: StatsSummary = { count: 0, mean: 0, stdDev: 0, min: 0, max: 0 };
  if (sessions.length === 0) return { sessions: [], stats: { sentimentScore: empty, valence: empty, arousal: empty, heartRate: empty, skinConductance: empty }, correlations: [] };
  const ss = sessions.map(s => s.speech.sentimentScore);
  const va = sessions.map(s => s.selfReport.valence);
  const ar = sessions.map(s => s.selfReport.arousal);
  const hr = sessions.map(s => s.biometrics.heartRate);
  const sc = sessions.map(s => s.biometrics.skinConductance);
  const cnt = sessions.length;
  const pairs: [string, string, number[], number[]][] = [
    ["AI感情スコア", "自己報告 (Valence)", ss, va],
    ["AI感情スコア", "心拍数", ss, hr],
    ["自己報告 (Valence)", "心拍数", va, hr],
    ["自己報告 (Arousal)", "心拍数", ar, hr],
    ["自己報告 (Arousal)", "皮膚コンダクタンス", ar, sc],
    ["AI感情スコア", "自己報告 (Arousal)", ss, ar],
  ];
  const correlations: CorrelationResult[] = pairs.map(([vx, vy, x, y]) => {
    const r = pearsonCorrelation(x, y);
    return { variableX: vx, variableY: vy, r, n: cnt, interpretation: interpretCorrelation(r, cnt) };
  });
  return { sessions, stats: { sentimentScore: calculateStats(ss), valence: calculateStats(va), arousal: calculateStats(ar), heartRate: calculateStats(hr), skinConductance: calculateStats(sc) }, correlations };
}
export function normalize(values: number[]): number[] {
  const mn = Math.min(...values); const mx = Math.max(...values); const range = mx - mn;
  if (range === 0) return values.map(() => 0.5);
  return values.map(v => (v - mn) / range);
}
