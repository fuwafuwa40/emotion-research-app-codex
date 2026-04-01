export type SentimentLabel = "positive" | "negative" | "neutral";
export interface SpeechData { text: string; sentimentScore: number; sentimentLabel: SentimentLabel; }
export interface SelfReportData { valence: number; arousal: number; }
export interface BiometricData { heartRate: number; skinConductance: number; }
export interface Session { id: string; timestamp: string; speech: SpeechData; selfReport: SelfReportData; biometrics: BiometricData; }
export interface StatsSummary { count: number; mean: number; stdDev: number; min: number; max: number; }
export interface CorrelationResult { variableX: string; variableY: string; r: number; n: number; interpretation: string; }
export interface AnalysisData { sessions: Session[]; stats: { sentimentScore: StatsSummary; valence: StatsSummary; arousal: StatsSummary; heartRate: StatsSummary; skinConductance: StatsSummary; }; correlations: CorrelationResult[]; }
