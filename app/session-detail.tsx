import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useSessionStore } from "@/lib/session-store";
import { useColors } from "@/hooks/use-colors";

function DataRow({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ color: colors.muted, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>{value}{unit ? " " + unit : ""}</Text>
    </View>
  );
}

export default function SessionDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions } = useSessionStore();
  const session = sessions.find((s) => s.id === id);
  if (!session) return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: colors.muted, fontSize: 16 }}>Session not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}><Text style={{ color: colors.primary, fontSize: 16 }}>Go back</Text></TouchableOpacity>
      </View>
    </ScreenContainer>
  );
  const d = new Date(session.timestamp);
  const dateStr = d.getFullYear() + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getDate()).padStart(2, "0") + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  const sentColor = session.speech.sentimentLabel === "positive" ? colors.success : session.speech.sentimentLabel === "negative" ? colors.error : colors.warning;
  const sentJa = session.speech.sentimentLabel === "positive" ? "ポジティブ" : session.speech.sentimentLabel === "negative" ? "ネガティブ" : "ニュートラル";
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginBottom: 16 }}>
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "800" }}>Session Detail</Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>{dateStr}</Text>
        </View>
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginBottom: 12 }}>発話データ</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.foreground, fontSize: 14, lineHeight: 22, marginBottom: 16 }}>{session.speech.text}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ backgroundColor: sentColor, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>{sentJa}</Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: 13 }}>スコア: {session.speech.sentimentScore > 0 ? "+" : ""}{session.speech.sentimentScore.toFixed(3)}</Text>
            </View>
          </View>
        </View>
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginBottom: 12 }}>自己報告データ</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
            <DataRow label="快・不快 (Valence)" value={session.selfReport.valence} unit="/ 9" />
            <DataRow label="覚醒度 (Arousal)" value={session.selfReport.arousal} unit="/ 9" />
            <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 12 }}>Valence: 1=非常に不快 → 9=非常に快{"\n"}Arousal: 1=非常に低覚醒 → 9=非常に高覚醒</Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginBottom: 12 }}>生体データ</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
            <DataRow label="心拍数 (Heart Rate)" value={session.biometrics.heartRate} unit="bpm" />
            <DataRow label="皮膚コンダクタンス (SC)" value={session.biometrics.skinConductance.toFixed(2)} unit="uS" />
          </View>
        </View>
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>Session ID: {session.id}</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
