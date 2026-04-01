import { useState } from "react";
import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useSessionStore } from "@/lib/session-store";
import { useColors } from "@/hooks/use-colors";

function StepDots({ current, total }: { current: number; total: number }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: i + 1 <= current ? colors.primary : colors.surface, borderWidth: 2, borderColor: i + 1 <= current ? colors.primary : colors.border, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: i + 1 <= current ? "#fff" : colors.muted, fontSize: 14, fontWeight: "700" }}>{i + 1}</Text>
          </View>
          {i < total - 1 && <View style={{ width: 20, height: 2, backgroundColor: i + 1 < current ? colors.primary : colors.border }} />}
        </View>
      ))}
    </View>
  );
}

function RatingRow({ label, value, onChange, min, max, leftLabel, rightLabel }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; leftLabel: string; rightLabel: string }) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "600", marginBottom: 8 }}>{label}: {value}</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ color: colors.muted, fontSize: 11 }}>{leftLabel}</Text>
        <Text style={{ color: colors.muted, fontSize: 11 }}>{rightLabel}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((s) => (
          <TouchableOpacity key={s} onPress={() => onChange(s)} activeOpacity={0.7} style={{ flex: 1, height: 40, borderRadius: 8, backgroundColor: s === value ? colors.primary : colors.surface, borderWidth: 1, borderColor: s === value ? colors.primary : colors.border, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: s === value ? "#fff" : colors.foreground, fontSize: 13, fontWeight: "600" }}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function RecordScreen() {
  const colors = useColors();
  const router = useRouter();
  const { addSession } = useSessionStore();
  const [step, setStep] = useState(1);
  const [speechText, setSpeechText] = useState("");
  const [valence, setValence] = useState(5);
  const [arousal, setArousal] = useState(5);
  const [heartRate, setHeartRate] = useState("");
  const [skinConductance, setSkinConductance] = useState("");

  const handleSave = async () => {
    const hr = parseFloat(heartRate); const sc = parseFloat(skinConductance);
    if (isNaN(hr) || isNaN(sc)) { Alert.alert("入力エラー", "心拍数と皮膚コンダクタンスを数値で入力してください。"); return; }
    try {
      await addSession({ speechText, selfReport: { valence, arousal }, biometrics: { heartRate: hr, skinConductance: sc } });
      Alert.alert("保存完了", "セッションが記録されました。", [{ text: "OK", onPress: () => { setStep(1); setSpeechText(""); setValence(5); setArousal(5); setHeartRate(""); setSkinConductance(""); router.push("/(tabs)" as any); } }]);
    } catch { Alert.alert("エラー", "保存に失敗しました。"); }
  };

  const titles = ["発話テキスト入力", "自己報告 (感情評定)", "生体データ入力"];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 }}>
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "800", marginBottom: 4 }}>New Session</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 20 }}>{titles[step - 1]}</Text>
        <StepDots current={step} total={3} />
        {step === 1 && (
          <View>
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "600", marginBottom: 8 }}>発話内容を入力してください</Text>
            <TextInput value={speechText} onChangeText={setSpeechText} placeholder="今日の気分や出来事について..." placeholderTextColor={colors.muted} multiline numberOfLines={6} textAlignVertical="top" style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, color: colors.foreground, fontSize: 15, lineHeight: 22, minHeight: 160 }} />
            <TouchableOpacity onPress={() => { if (speechText.trim().length > 0) setStep(2); else Alert.alert("入力エラー", "テキストを入力してください。"); }} activeOpacity={0.8} style={{ backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 24 }}>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>次へ</Text>
            </TouchableOpacity>
          </View>
        )}
        {step === 2 && (
          <View>
            <RatingRow label="快・不快 (Valence)" value={valence} onChange={setValence} min={1} max={9} leftLabel="非常に不快" rightLabel="非常に快" />
            <RatingRow label="覚醒度 (Arousal)" value={arousal} onChange={setArousal} min={1} max={9} leftLabel="非常に低覚醒" rightLabel="非常に高覚醒" />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
              <TouchableOpacity onPress={() => setStep(1)} activeOpacity={0.8} style={{ flex: 1, backgroundColor: colors.surface, paddingVertical: 14, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>戻る</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep(3)} activeOpacity={0.8} style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: "center" }}>
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>次へ</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {step === 3 && (
          <View>
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "600", marginBottom: 12 }}>生体データ</Text>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 6 }}>心拍数 (bpm)</Text>
              <TextInput value={heartRate} onChangeText={setHeartRate} placeholder="例: 72" placeholderTextColor={colors.muted} keyboardType="numeric" returnKeyType="done" style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border, color: colors.foreground, fontSize: 16 }} />
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 6 }}>皮膚コンダクタンス (uS)</Text>
              <TextInput value={skinConductance} onChangeText={setSkinConductance} placeholder="例: 2.5" placeholderTextColor={colors.muted} keyboardType="decimal-pad" returnKeyType="done" style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border, color: colors.foreground, fontSize: 16 }} />
            </View>
            <TouchableOpacity onPress={() => { setHeartRate(String(Math.round(60 + Math.random() * 40))); setSkinConductance(String(Math.round((1 + Math.random() * 4) * 100) / 100)); }} activeOpacity={0.7} style={{ backgroundColor: colors.surface, paddingVertical: 10, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "600" }}>ダミー値を生成</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => setStep(2)} activeOpacity={0.8} style={{ flex: 1, backgroundColor: colors.surface, paddingVertical: 14, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>戻る</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} activeOpacity={0.8} style={{ flex: 1, backgroundColor: colors.success, paddingVertical: 14, borderRadius: 12, alignItems: "center" }}>
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
