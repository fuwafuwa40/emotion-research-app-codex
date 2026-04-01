import { useMemo } from "react";
import { ScrollView, Text, View, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useSessionStore } from "@/lib/session-store";
import { useColors } from "@/hooks/use-colors";
import { generateAnalysisData, normalize } from "@/lib/statistics";
import type { CorrelationResult, StatsSummary } from "@/lib/types";

function CorrelationCard({ corr }: { corr: CorrelationResult }) {
  const colors = useColors();
  const absR = Math.abs(corr.r);
  const barColor = absR >= 0.7 ? colors.success : absR >= 0.4 ? colors.warning : colors.muted;
  const barWidth = Math.max(absR * 100, 5);
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
        <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600", flex: 1 }}>{corr.variableX} x {corr.variableY}</Text>
        <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "800" }}>r = {corr.r.toFixed(3)}</Text>
      </View>
      <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, marginBottom: 6 }}>
        <View style={{ height: 6, width: `${barWidth}%`, backgroundColor: barColor, borderRadius: 3 }} />
      </View>
      <Text style={{ color: colors.muted, fontSize: 11 }}>{corr.interpretation}</Text>
    </View>
  );
}

function StatsTable({ stats }: { stats: Record<string, StatsSummary> }) {
  const colors = useColors();
  const labels: Record<string, string> = { sentimentScore: "AI感情スコア", valence: "Valence", arousal: "Arousal", heartRate: "心拍数", skinConductance: "SC" };
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
      <View style={{ flexDirection: "row", backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 12 }}>
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", flex: 2 }}>変数</Text>
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", flex: 1, textAlign: "center" }}>Mean</Text>
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", flex: 1, textAlign: "center" }}>SD</Text>
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", flex: 1, textAlign: "center" }}>Min</Text>
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", flex: 1, textAlign: "center" }}>Max</Text>
      </View>
      {Object.entries(stats).map(([key, s]) => (
        <View key={key} style={{ flexDirection: "row", paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ color: colors.foreground, fontSize: 12, flex: 2 }}>{labels[key] || key}</Text>
          <Text style={{ color: colors.foreground, fontSize: 12, flex: 1, textAlign: "center" }}>{s.mean.toFixed(2)}</Text>
          <Text style={{ color: colors.muted, fontSize: 12, flex: 1, textAlign: "center" }}>{s.stdDev.toFixed(2)}</Text>
          <Text style={{ color: colors.muted, fontSize: 12, flex: 1, textAlign: "center" }}>{s.min.toFixed(2)}</Text>
          <Text style={{ color: colors.muted, fontSize: 12, flex: 1, textAlign: "center" }}>{s.max.toFixed(2)}</Text>
        </View>
      ))}
    </View>
  );
}

function MiniBarChart({ data, color, label }: { data: number[]; color: string; label: string }) {
  const colors = useColors();
  if (data.length < 2) return null;
  const normalized = normalize(data);
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <View style={{ width: 12, height: 3, backgroundColor: color, borderRadius: 2 }} />
        <Text style={{ color: colors.muted, fontSize: 11 }}>{label}</Text>
      </View>
      <View style={{ flexDirection: "row", height: 50, alignItems: "flex-end", gap: 1 }}>
        {normalized.map((v, i) => (
          <View key={i} style={{ flex: 1, height: Math.max(v * 46, 2) + 4, backgroundColor: color, borderTopLeftRadius: 2, borderTopRightRadius: 2, opacity: 0.7 + v * 0.3 }} />
        ))}
      </View>
    </View>
  );
}

export default function AnalysisScreen() {
  const colors = useColors();
  const { sessions, loading } = useSessionStore();
  const analysisData = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return generateAnalysisData(sorted);
  }, [sessions]);

  if (loading) return <ScreenContainer><View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color={colors.primary} /></View></ScreenContainer>;

  if (sessions.length === 0) return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "700", marginBottom: 8 }}>No Data</Text>
        <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center", lineHeight: 20 }}>{"分析にはセッションデータが必要です。\nSessions タブでダミーデータを生成するか、\nRecord タブからデータを入力してください。"}</Text>
      </View>
    </ScreenContainer>
  );

  const sorted = [...sessions].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 }}>
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "800", marginBottom: 4 }}>Analysis</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 20 }}>{sessions.length} sessions | 相関分析</Text>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>Sessions</Text>
            <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "800" }}>{sessions.length}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>Avg Valence</Text>
            <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "800" }}>{analysisData.stats.valence.mean.toFixed(1)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>Avg HR</Text>
            <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "800" }}>{analysisData.stats.heartRate.mean.toFixed(0)}</Text>
          </View>
        </View>

        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginBottom: 12 }}>時系列推移</Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
          <MiniBarChart data={sorted.map(s => s.speech.sentimentScore)} color={colors.primary} label="AI感情スコア" />
          <MiniBarChart data={sorted.map(s => s.selfReport.valence)} color={colors.success} label="自己報告 (Valence)" />
          <MiniBarChart data={sorted.map(s => s.biometrics.heartRate)} color={colors.error} label="心拍数 (bpm)" />
          <Text style={{ color: colors.muted, fontSize: 10, marginTop: 4 }}>各系列は0-1に正規化して表示</Text>
        </View>

        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginBottom: 12 }}>相関分析</Text>
        {analysisData.correlations.map((c, i) => <CorrelationCard key={i} corr={c} />)}

        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginBottom: 12, marginTop: 12 }}>統計サマリー</Text>
        <StatsTable stats={analysisData.stats} />

        <View style={{ marginTop: 16, padding: 12, backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16 }}>注意: この分析は研究用プロトタイプによるものです。感情分析は簡易辞書ベースであり、相関係数はピアソンの積率相関係数を使用しています。</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
