import type { Session } from "./types";
import { analyzeSentiment } from "./sentiment";
const SAMPLES = [
  { text: "今日のミーティングはとても良い雰囲気で、チームの皆が協力的でした。嬉しいです。", vh: 7, ah: 5 },
  { text: "締め切りが近づいていて少し不安です。でも頑張ります。", vh: 4, ah: 6 },
  { text: "昨日の発表で失敗してしまい、とても落ち込んでいます。", vh: 2, ah: 4 },
  { text: "新しいアイデアが浮かんで、とてもわくわくしています。早く試したい。", vh: 8, ah: 8 },
  { text: "特に何も感じない普通の一日でした。いつも通りの作業をこなしました。", vh: 5, ah: 3 },
  { text: "同僚との意見の食い違いでイライラしました。辛いです。", vh: 3, ah: 7 },
  { text: "友人と久しぶりに会えて、とても楽しい時間を過ごしました。笑顔の一日。", vh: 9, ah: 7 },
  { text: "体調が悪くて一日中寝ていました。何もする気が起きません。疲れました。", vh: 2, ah: 2 },
  { text: "研究の結果が予想通りで、達成感があります。成功しました。", vh: 7, ah: 6 },
  { text: "電車が遅延して約束に遅れてしまいました。残念です。", vh: 3, ah: 5 },
  { text: "静かなカフェで読書をしていました。穏やかで心地よい時間でした。", vh: 7, ah: 2 },
  { text: "大きなプレゼンの前で緊張しています。心配で落ち着きません。", vh: 4, ah: 9 },
  { text: "子供の成長を見て感動しました。素晴らしい瞬間に立ち会えて幸せです。", vh: 9, ah: 6 },
  { text: "仕事のミスを上司に指摘されて恥ずかしかったです。失敗しました。", vh: 3, ah: 6 },
  { text: "週末の予定を考えるだけで楽しみです。期待しています。", vh: 7, ah: 5 },
  { text: "長時間のデスクワークで疲れました。ストレスがたまっています。", vh: 3, ah: 3 },
  { text: "新しいレストランで美味しい料理を食べました。満足です。", vh: 8, ah: 5 },
  { text: "将来のことを考えると不安になります。心配です。", vh: 3, ah: 5 },
  { text: "運動した後のスッキリした気分は最高です。元気になりました。", vh: 8, ah: 7 },
  { text: "特に変わったことはなく、淡々と過ごしました。平穏な日です。", vh: 5, ah: 2 },
];
function gaussRand(mean: number, sd: number): number {
  const u1 = Math.random(), u2 = Math.random();
  return mean + Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sd;
}
function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }
function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
export function generateDummySessions(count: number = 20): Session[] {
  const sessions: Session[] = [];
  const start = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const interval = (30 * 24 * 60 * 60 * 1000) / count;
  for (let i = 0; i < count; i++) {
    const sample = SAMPLES[i % SAMPLES.length];
    const result = analyzeSentiment(sample.text);
    const valence = clamp(Math.round(gaussRand(sample.vh, 1)), 1, 9);
    const arousal = clamp(Math.round(gaussRand(sample.ah, 1)), 1, 9);
    const heartRate = clamp(Math.round(gaussRand(60 + (arousal - 1) * 5, 8)), 50, 140);
    const skinConductance = clamp(Math.round(gaussRand(1 + (arousal - 1) * 0.5, 0.8) * 100) / 100, 0.1, 10);
    const ts = new Date(start + i * interval + Math.random() * interval * 0.5);
    sessions.push({
      id: uuid(), timestamp: ts.toISOString(),
      speech: { text: sample.text, sentimentScore: result.score, sentimentLabel: result.label },
      selfReport: { valence, arousal }, biometrics: { heartRate, skinConductance },
    });
  }
  return sessions.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
