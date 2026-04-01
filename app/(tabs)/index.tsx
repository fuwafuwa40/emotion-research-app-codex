import { FlatList, Text, View, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useSessionStore } from "@/lib/session-store";
import { useColors } from "@/hooks/use-colors";
import type { Session } from "@/lib/types";

function SessionCard({ session, onPress }: { session: Session; onPress: () => void }) {
  const colors = useColors();
  const d = new Date(session.timestamp);
  const dateStr = d.getFullYear() + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getDate()).padStart(2, "0") + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  const sentColor = session.speech.sentimentLabel === "positive" ? colors.success : session.speech.sentimentLabel === "negative" ? colors.error : colors.warning;
  const sentJa = session.speech.sentimentLabel === "positive" ? "Positive" : session.speech.sentimentLabel === "negative" ? "Negative" : "Neutral";
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{dateStr}</Text>
        <View style={{ backgroundColor: sentColor, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 }}>
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{sentJa}</Text>
        </View>
      </View>
      <Text numberOfLines={2} style={{ color: colors.foreground, fontSize: 14, lineHeight: 20, marginBottom: 10 }}>{session.speech.text}</Text>
      <View style={{ flexDirection: "row", gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>V:</Text>
          <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600" }}>{session.selfReport.valence}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>A:</Text>
          <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600" }}>{session.selfReport.arousal}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>HR:</Text>
          <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600" }}>{session.biometrics.heartRate}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>SC:</Text>
          <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600" }}>{session.biometrics.skinConductance.toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { sessions, loading, loadDummyData, clearAll } = useSessionStore();
  const sorted = [...sessions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (loading) return (<ScreenContainer><View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color={colors.primary} /></View></ScreenContainer>);
  return (
    <ScreenContainer>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}>
        <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: "800" }}>EmotionLab</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>感情相関分析 研究プロトタイプ</Text>
      </View>
      <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 12 }}>
        <TouchableOpacity onPress={() => loadDummyData()} activeOpacity={0.7} style={{ backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}>
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>+20 Dummy</Text>
        </TouchableOpacity>
        {sessions.length > 0 && (
          <TouchableOpacity onPress={() => Alert.alert("全データ削除", "全てのセッションを削除しますか？", [{ text: "キャンセル" }, { text: "削除", style: "destructive", onPress: () => clearAll() }])} activeOpacity={0.7} style={{ backgroundColor: colors.error, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}>
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      {sorted.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", marginBottom: 8 }}>No Sessions</Text>
          <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center", lineHeight: 20 }}>{"Record タブからデータを入力するか、\n上の「+20 Dummy」ボタンで\nダミーデータを生成してください。"}</Text>
        </View>
      ) : (
        <FlatList data={sorted} keyExtractor={(item) => item.id} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          renderItem={({ item }) => (<SessionCard session={item} onPress={() => router.push({ pathname: "/session-detail", params: { id: item.id } } as any)} />)} />
      )}
    </ScreenContainer>
  );
}
