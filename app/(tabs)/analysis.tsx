import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Defs, Line as SvgLine, LinearGradient, Path, Stop } from "react-native-svg";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { generateAnalysisReportHtml } from "@/lib/analysis-report";
import { generateAnalysisData } from "@/lib/statistics";
import { useSessionStore } from "@/lib/session-store";
import type { AnalysisData, CorrelationResult, Session, StatsSummary } from "@/lib/types";

type TrendMetricKey = keyof AnalysisData["stats"];

type TrendMetricConfig = {
  key: TrendMetricKey;
  title: string;
  description: string;
  color: string;
};

type ChartPoint = {
  x: number;
  y: number;
};

function getMetricValue(session: Session, key: TrendMetricKey): number {
  switch (key) {
    case "sentimentScore":
      return session.speech.sentimentScore;
    case "valence":
      return session.selfReport.valence;
    case "arousal":
      return session.selfReport.arousal;
    case "heartRate":
      return session.biometrics.heartRate;
    case "skinConductance":
      return session.biometrics.skinConductance;
  }
}

function formatMetricValue(key: TrendMetricKey, value: number): string {
  switch (key) {
    case "sentimentScore":
      return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
    case "valence":
    case "arousal":
      return value.toFixed(1);
    case "heartRate":
      return `${value.toFixed(0)} bpm`;
    case "skinConductance":
      return `${value.toFixed(2)} uS`;
  }
}

function formatDateLabel(timestamp: string): string {
  const date = new Date(timestamp);
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function buildLinePath(points: ChartPoint[]): string {
  if (points.length === 0) {
    return "";
  }

  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function buildAreaPath(points: ChartPoint[], height: number): string {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    const point = points[0];
    return `M ${point.x} ${point.y} L ${point.x} ${height} Z`;
  }

  const first = points[0];
  const last = points[points.length - 1];
  return `${buildLinePath(points)} L ${last.x} ${height} L ${first.x} ${height} Z`;
}

function getCorrelationAccent(
  correlation: number,
  positiveColor: string,
  negativeColor: string,
  neutralColor: string,
) {
  if (Math.abs(correlation) < 0.2) {
    return neutralColor;
  }

  return correlation >= 0 ? positiveColor : negativeColor;
}

function SummaryCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  const colors = useColors();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 10,
      }}
    >
      <View style={{ width: 28, height: 4, borderRadius: 999, backgroundColor: color }} />
      <View>
        <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>{title}</Text>
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "800" }}>{value}</Text>
      </View>
    </View>
  );
}

function TrendChartCard({
  metricKey,
  title,
  description,
  color,
  data,
  labels,
  summary,
}: {
  metricKey: TrendMetricKey;
  title: string;
  description: string;
  color: string;
  data: number[];
  labels: string[];
  summary: StatsSummary;
}) {
  const colors = useColors();
  const [chartWidth, setChartWidth] = useState(0);

  if (data.length === 0) {
    return null;
  }

  const chartHeight = 150;
  const yAxisWidth = 58;
  const latestValue = data[data.length - 1];
  const safeRange = summary.max - summary.min || 1;
  const innerWidth = Math.max(chartWidth - yAxisWidth - 12, 0);
  const middleValue = summary.min + safeRange / 2;
  const points =
    innerWidth > 0
      ? data.map((value, index) => {
          const x = data.length === 1 ? innerWidth / 2 : (innerWidth / (data.length - 1)) * index;
          const normalized = (value - summary.min) / safeRange;
          const y = chartHeight - normalized * chartHeight;
          return { x, y };
        })
      : [];

  const gradientId = `trend-${metricKey}`;
  const firstLabel = labels[0] ?? "";
  const middleLabel = labels[Math.floor((labels.length - 1) / 2)] ?? "";
  const lastLabel = labels[labels.length - 1] ?? "";

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 14,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginBottom: 4 }}>
            {title}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>{description}</Text>
        </View>
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 12,
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 10, marginBottom: 2 }}>Latest</Text>
          <Text style={{ color, fontSize: 15, fontWeight: "800" }}>
            {formatMetricValue(metricKey, latestValue)}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
        <MiniStatCard label="Mean" value={formatMetricValue(metricKey, summary.mean)} />
        <MiniStatCard
          label="Range"
          value={`${formatMetricValue(metricKey, summary.min)} - ${formatMetricValue(metricKey, summary.max)}`}
        />
      </View>

      <View
        onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
        style={{ flexDirection: "row", alignItems: "stretch", gap: 12 }}
      >
        <View style={{ width: yAxisWidth, height: chartHeight, justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>{formatMetricValue(metricKey, summary.max)}</Text>
          <Text style={{ color: colors.muted, fontSize: 11 }}>
            {formatMetricValue(metricKey, middleValue)}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 11 }}>{formatMetricValue(metricKey, summary.min)}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <View
            style={{
              height: chartHeight,
              borderRadius: 14,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: "hidden",
            }}
          >
            {innerWidth > 0 && (
              <Svg width={innerWidth} height={chartHeight}>
                <Defs>
                  <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={color} stopOpacity="0.28" />
                    <Stop offset="100%" stopColor={color} stopOpacity="0.02" />
                  </LinearGradient>
                </Defs>

                <SvgLine x1="0" y1="0" x2={innerWidth} y2="0" stroke={colors.border} strokeDasharray="4 4" />
                <SvgLine
                  x1="0"
                  y1={chartHeight / 2}
                  x2={innerWidth}
                  y2={chartHeight / 2}
                  stroke={colors.border}
                  strokeDasharray="4 4"
                />
                <SvgLine
                  x1="0"
                  y1={chartHeight}
                  x2={innerWidth}
                  y2={chartHeight}
                  stroke={colors.border}
                  strokeDasharray="4 4"
                />

                {points.length > 1 && (
                  <>
                    <Path d={buildAreaPath(points, chartHeight)} fill={`url(#${gradientId})`} />
                    <Path
                      d={buildLinePath(points)}
                      fill="none"
                      stroke={color}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                )}

                {points.map((point, index) => {
                  const isLatest = index === points.length - 1;

                  return (
                    <Circle
                      key={`${metricKey}-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r={isLatest ? 4.5 : 3}
                      fill={isLatest ? color : colors.surface}
                      stroke={color}
                      strokeWidth={2}
                    />
                  );
                })}
              </Svg>
            )}
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            <Text style={{ color: colors.muted, fontSize: 11 }}>{firstLabel}</Text>
            <Text style={{ color: colors.muted, fontSize: 11 }}>{middleLabel}</Text>
            <Text style={{ color: colors.muted, fontSize: 11 }}>{lastLabel}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function MiniStatCard({ label, value }: { label: string; value: string }) {
  const colors = useColors();

  return (
    <View
      style={{
        flex: 1,
        padding: 10,
        borderRadius: 12,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ color: colors.muted, fontSize: 10, marginBottom: 3 }}>{label}</Text>
      <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 13, fontWeight: "700" }}>
        {value}
      </Text>
    </View>
  );
}

function CorrelationCard({ correlation }: { correlation: CorrelationResult }) {
  const colors = useColors();
  const accent = getCorrelationAccent(correlation.r, colors.success, colors.error, colors.warning);
  const fillWidth = `${Math.max(Math.abs(correlation.r) * 50, 2)}%` as `${number}%`;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700", marginBottom: 3 }}>
            {correlation.variableX} x {correlation.variableY}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 11 }}>n = {correlation.n}</Text>
        </View>
        <Text style={{ color: accent, fontSize: 18, fontWeight: "800" }}>
          r = {correlation.r.toFixed(3)}
        </Text>
      </View>

      <View
        style={{
          height: 44,
          borderRadius: 12,
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          position: "relative",
          justifyContent: "center",
          marginBottom: 8,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            left: "50%",
            top: 8,
            bottom: 8,
            width: 1,
            backgroundColor: colors.border,
          }}
        />

        <View
          style={{
            position: "absolute",
            top: 12,
            bottom: 12,
            borderRadius: 999,
            backgroundColor: accent,
            opacity: 0.9,
            width: fillWidth,
            left: correlation.r >= 0 ? "50%" : undefined,
            right: correlation.r < 0 ? "50%" : undefined,
          }}
        />

        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 10 }}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>-1</Text>
          <Text style={{ color: colors.muted, fontSize: 11 }}>0</Text>
          <Text style={{ color: colors.muted, fontSize: 11 }}>+1</Text>
        </View>
      </View>

      <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 17 }}>
        {correlation.interpretation}
      </Text>
    </View>
  );
}

function ExportButton({
  onPress,
  disabled,
  label,
}: {
  onPress: () => void;
  disabled: boolean;
  label: string;
}) {
  const colors = useColors();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled}
      onPress={onPress}
      style={{
        backgroundColor: colors.primary,
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

export default function AnalysisScreen() {
  const colors = useColors();
  const { sessions, loading } = useSessionStore();
  const [isExporting, setIsExporting] = useState(false);

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
      ),
    [sessions],
  );
  const analysisData = useMemo(() => generateAnalysisData(sortedSessions), [sortedSessions]);

  const trendCharts = useMemo<TrendMetricConfig[]>(
    () => [
      {
        key: "sentimentScore",
        title: "AI Sentiment",
        description: "Dictionary-based sentiment score derived from the speech text.",
        color: colors.primary,
      },
      {
        key: "valence",
        title: "Valence",
        description: "Self-reported pleasantness level.",
        color: colors.success,
      },
      {
        key: "arousal",
        title: "Arousal",
        description: "Self-reported activation level.",
        color: colors.warning,
      },
      {
        key: "heartRate",
        title: "Heart Rate",
        description: "Heart rate trend across recorded sessions.",
        color: colors.error,
      },
      {
        key: "skinConductance",
        title: "Skin Conductance",
        description: "Skin conductance trend across recorded sessions.",
        color: colors.tint,
      },
    ],
    [colors.error, colors.primary, colors.success, colors.tint, colors.warning],
  );

  const handleExportReport = async () => {
    try {
      setIsExporting(true);
      const html = generateAnalysisReportHtml(analysisData);

      if (Platform.OS === "web") {
        await Print.printAsync({ html });
        return;
      }

      const exportFileName = `emotion-report-${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`;
      const printResult = await Print.printToFileAsync({ html });
      const sourceFile = new File(printResult.uri);
      const destinationFile = new File(Paths.document, exportFileName);

      if (destinationFile.exists) {
        destinationFile.delete();
      }

      sourceFile.copy(destinationFile);

      Alert.alert("PDF ready", destinationFile.uri, [
        { text: "Close", style: "cancel" },
        {
          text: "Open",
          onPress: () => {
            void Linking.openURL(destinationFile.uri).catch(() => {
              Alert.alert("Unable to open file", destinationFile.uri);
            });
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        "PDF export failed",
        error instanceof Error ? error.message : "Unknown export error",
      );
    } finally {
      setIsExporting(false);
    }
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

  if (sessions.length === 0) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
          <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "700", marginBottom: 8 }}>
            No Data
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center", lineHeight: 20 }}>
            Add sessions first. Analysis and PDF export become available once data exists.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "800", marginBottom: 4 }}>
              Analysis
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              {sessions.length} sessions with trends, summary stats, and correlations
            </Text>
          </View>
          <ExportButton
            label={isExporting ? "Exporting..." : "Save PDF"}
            onPress={() => void handleExportReport()}
            disabled={isExporting}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
          <SummaryCard title="Sessions" value={String(sessions.length)} color={colors.primary} />
          <SummaryCard title="Avg Valence" value={analysisData.stats.valence.mean.toFixed(1)} color={colors.success} />
          <SummaryCard title="Avg HR" value={`${analysisData.stats.heartRate.mean.toFixed(0)} bpm`} color={colors.error} />
        </View>

        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginBottom: 12 }}>
          Time Trends
        </Text>
        <View style={{ marginBottom: 24 }}>
          {trendCharts.map((chart) => (
            <TrendChartCard
              key={chart.key}
              metricKey={chart.key}
              title={chart.title}
              description={chart.description}
              color={chart.color}
              data={sortedSessions.map((session) => getMetricValue(session, chart.key))}
              labels={sortedSessions.map((session) => formatDateLabel(session.timestamp))}
              summary={analysisData.stats[chart.key]}
            />
          ))}
        </View>

        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginBottom: 12 }}>
          Correlations
        </Text>
        {analysisData.correlations.map((correlation, index) => (
          <CorrelationCard
            key={`${correlation.variableX}-${correlation.variableY}-${index}`}
            correlation={correlation}
          />
        ))}

        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginBottom: 12, marginTop: 12 }}>
          Statistical Summary
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colors.primary,
              paddingVertical: 10,
              paddingHorizontal: 12,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", flex: 2 }}>Metric</Text>
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", flex: 1, textAlign: "center" }}>
              Mean
            </Text>
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", flex: 1, textAlign: "center" }}>
              SD
            </Text>
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", flex: 1, textAlign: "center" }}>
              Min
            </Text>
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", flex: 1, textAlign: "center" }}>
              Max
            </Text>
          </View>

          {(
            [
              ["sentimentScore", "AI Sentiment"],
              ["valence", "Valence"],
              ["arousal", "Arousal"],
              ["heartRate", "Heart Rate"],
              ["skinConductance", "Skin Conductance"],
            ] as const
          ).map(([key, label]) => {
            const stats = analysisData.stats[key];

            return (
              <View
                key={key}
                style={{
                  flexDirection: "row",
                  paddingVertical: 11,
                  paddingHorizontal: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ color: colors.foreground, fontSize: 12, flex: 2 }}>{label}</Text>
                <Text style={{ color: colors.foreground, fontSize: 12, flex: 1, textAlign: "center" }}>
                  {stats.mean.toFixed(2)}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12, flex: 1, textAlign: "center" }}>
                  {stats.stdDev.toFixed(2)}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12, flex: 1, textAlign: "center" }}>
                  {stats.min.toFixed(2)}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12, flex: 1, textAlign: "center" }}>
                  {stats.max.toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>

        <View
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 17 }}>
            PDF export includes the current summary, correlation table, and a recent-session appendix.
            On web it opens the browser print dialog. On native it writes a PDF file into the app
            document directory.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
