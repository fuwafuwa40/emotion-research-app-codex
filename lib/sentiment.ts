import type { SentimentLabel } from "./types";
const POS = ["嬉しい","楽しい","幸せ","素晴らしい","良い","好き","最高","感謝","ありがとう","素敵","快適","安心","満足","喜び","期待","希望","笑顔","元気","明るい","優しい","美しい","面白い","興味深い","すごい","感動","愛","幸福","成功","達成","充実","穏やか","爽やか","心地よい","わくわく","happy","joy","love","great","good","wonderful","excellent","amazing","fantastic","beautiful","glad","pleased","grateful","excited","delighted","cheerful","positive","hope","smile","enjoy","comfortable","peaceful","satisfied"];
const NEG = ["悲しい","辛い","苦しい","嫌い","怒り","不安","心配","恐怖","怖い","寂しい","孤独","失望","絶望","後悔","イライラ","ストレス","疲れ","困る","問題","失敗","悪い","最悪","つまらない","退屈","不満","痛い","泣く","落ち込む","憂鬱","暗い","残念","sad","angry","hate","bad","terrible","awful","horrible","fear","scared","worried","anxious","depressed","lonely","disappointed","frustrated","stressed","tired","pain","unhappy","miserable","upset","annoyed","boring","failure"];
const NEGATE = ["ない","くない","ません","なかった","not","no","never"];
export interface SentimentResult { score: number; label: SentimentLabel; positiveCount: number; negativeCount: number; totalWords: number; }
export function analyzeSentiment(text: string): SentimentResult {
  const n = text.toLowerCase();
  let pc = 0, nc = 0;
  for (const w of POS) if (n.includes(w.toLowerCase())) pc++;
  for (const w of NEG) if (n.includes(w.toLowerCase())) nc++;
  let neg = false;
  for (const w of NEGATE) if (n.includes(w.toLowerCase())) { neg = true; break; }
  if (neg) {
    if (pc > 0 || nc > 0) { const t = pc; pc = nc; nc = t; }
    else { nc = 1; }
  }
  const total = pc + nc;
  const tw = text.split(/[\s\u3000]+/).filter((w: string) => w.length > 0).length;
  let score = 0;
  if (total > 0) score = (pc - nc) / total;
  let label: SentimentLabel = "neutral";
  if (score > 0.1) label = "positive";
  else if (score < -0.1) label = "negative";
  return { score: Math.round(score * 1000) / 1000, label, positiveCount: pc, negativeCount: nc, totalWords: tw };
}
