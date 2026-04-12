import { describe, expect, it } from "vitest";

import { generateAnalysisReportHtml } from "../analysis-report";
import { generateAnalysisData } from "../statistics";
import type { Session } from "../types";

describe("generateAnalysisReportHtml", () => {
  it("renders summary and session content", () => {
    const sessions: Session[] = [
      {
        id: "1",
        timestamp: "2026-04-12T08:30:00.000Z",
        speech: {
          text: "I feel great today",
          sentimentScore: 0.8,
          sentimentLabel: "positive",
        },
        selfReport: {
          valence: 7,
          arousal: 4,
        },
        biometrics: {
          heartRate: 72,
          skinConductance: 0.45,
        },
      },
    ];

    const html = generateAnalysisReportHtml(generateAnalysisData(sessions));

    expect(html).toContain("EmotionLab Analysis Report");
    expect(html).toContain("AI Sentiment");
    expect(html).toContain("I feel great today");
  });
});
