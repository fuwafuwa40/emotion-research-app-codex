import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { parseSessionsCsv, SESSION_CSV_COLUMNS } from "@/lib/session-csv";
import { useSessionStore } from "@/lib/session-store";
import type { Session } from "@/lib/types";

function SessionCard({ session, onPress }: { session: Session; onPress: () => void }) {
  const colors = useColors();
  const sentColor =
    session.speech.sentimentLabel === "positive"
      ? colors.success
      : session.speech.sentimentLabel === "negative"
        ? colors.error
        : colors.warning;
  const sentimentLabel =
    session.speech.sentimentLabel === "positive"
      ? "Positive"
      : session.speech.sentimentLabel === "negative"
        ? "Negative"
        : "Neutral";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Text style={{ color: colors.muted, fontSize: 12 }}>{formatDateTime(session.timestamp)}</Text>
        <View
          style={{
            backgroundColor: sentColor,
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{sentimentLabel}</Text>
        </View>
      </View>

      <Text
        numberOfLines={2}
        style={{ color: colors.foreground, fontSize: 14, lineHeight: 20, marginBottom: 10 }}
      >
        {session.speech.text || "(empty text)"}
      </Text>

      <View style={{ flexDirection: "row", gap: 16 }}>
        <MetricPill label="V" value={session.selfReport.valence.toFixed(1)} />
        <MetricPill label="A" value={session.selfReport.arousal.toFixed(1)} />
        <MetricPill label="HR" value={session.biometrics.heartRate.toFixed(0)} />
        <MetricPill label="SC" value={session.biometrics.skinConductance.toFixed(2)} />
      </View>
    </TouchableOpacity>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  const colors = useColors();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Text style={{ color: colors.muted, fontSize: 11 }}>{label}:</Text>
      <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  backgroundColor,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  backgroundColor: string;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled}
      onPress={onPress}
      style={{
        backgroundColor,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { sessions, loading, clearAll, importSessions, loadDummyData } = useSessionStore();
  const [isImporting, setIsImporting] = useState(false);

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
      ),
    [sessions],
  );

  const handleImportCsv = async () => {
    try {
      setIsImporting(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/plain", "application/vnd.ms-excel"],
        copyToCacheDirectory: true,
        base64: false,
        multiple: false,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const csvText = await readDocumentText(result.assets[0]);
      const importResult = parseSessionsCsv(csvText);

      if (importResult.importedCount > 0) {
        await importSessions(importResult.sessions);
      }

      if (importResult.importedCount === 0) {
        Alert.alert(
          "CSV import failed",
          [
            "No valid rows were imported.",
            `Expected columns: ${SESSION_CSV_COLUMNS}`,
            formatImportErrors(importResult.errors),
          ]
            .filter(Boolean)
            .join("\n\n"),
        );
        return;
      }

      Alert.alert(
        "CSV import finished",
        [
          `Imported ${importResult.importedCount} session(s).`,
          `Skipped ${importResult.skippedCount} row(s).`,
          importResult.errors.length > 0 ? formatImportErrors(importResult.errors) : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
      );
    } catch (error) {
      Alert.alert(
        "CSV import failed",
        [
          `Expected columns: ${SESSION_CSV_COLUMNS}`,
          error instanceof Error ? error.message : "Unknown import error",
        ].join("\n\n"),
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearAll = () => {
    Alert.alert("Delete all sessions?", "This removes all local records.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void clearAll() },
    ]);
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}>
        <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: "800" }}>EmotionLab</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
          Local emotion sessions with CSV import support
        </Text>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          <ActionButton
            label={isImporting ? "Importing..." : "Import CSV"}
            onPress={() => void handleImportCsv()}
            backgroundColor={colors.primary}
            disabled={isImporting}
          />
          <ActionButton
            label="+20 Dummy"
            onPress={() => void loadDummyData()}
            backgroundColor={colors.success}
          />
          {sessions.length > 0 && (
            <ActionButton label="Clear All" onPress={handleClearAll} backgroundColor={colors.error} />
          )}
        </View>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 10, lineHeight: 18 }}>
          CSV columns: {SESSION_CSV_COLUMNS}
        </Text>
      </View>

      {sortedSessions.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
            No Sessions
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center", lineHeight: 20 }}>
            Import a CSV file, add dummy data, or record a new session from the Record tab.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedSessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              onPress={() =>
                router.push({
                  pathname: "/session-detail",
                  params: { id: item.id },
                } as never)
              }
            />
          )}
        />
      )}
    </ScreenContainer>
  );
}

async function readDocumentText(asset: DocumentPicker.DocumentPickerAsset): Promise<string> {
  if (Platform.OS === "web") {
    if (asset.file) {
      return asset.file.text();
    }

    const response = await fetch(asset.uri);
    return response.text();
  }

  return new File(asset.uri).text();
}

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);

  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatImportErrors(errors: Array<{ row: number; message: string }>): string {
  if (errors.length === 0) {
    return "";
  }

  const visibleErrors = errors.slice(0, 5).map((error) => `Row ${error.row}: ${error.message}`);
  const more = errors.length > 5 ? `...and ${errors.length - 5} more issue(s)` : "";

  return ["Issues:", ...visibleErrors, more].filter(Boolean).join("\n");
}
