import { describe, expect, it } from "vitest";

import { parseSessionsCsv } from "../session-csv";

describe("parseSessionsCsv", () => {
  it("imports a valid CSV row", () => {
    const csv = [
      "timestamp,speechText,valence,arousal,heartRate,skinConductance",
      "2026-04-12T08:30:00.000Z,I feel great today,7,4,72,0.45",
    ].join("\n");

    const result = parseSessionsCsv(csv);

    expect(result.importedCount).toBe(1);
    expect(result.skippedCount).toBe(0);
    expect(result.sessions[0].speech.sentimentLabel).toBe("positive");
    expect(result.sessions[0].selfReport.valence).toBe(7);
  });

  it("accepts alias headers", () => {
    const csv = [
      "date,text,v,a,hr,sc",
      "2026-04-12T08:30:00.000Z,neutral sample,5,3,68,0.31",
    ].join("\n");

    const result = parseSessionsCsv(csv);

    expect(result.importedCount).toBe(1);
    expect(result.sessions[0].biometrics.heartRate).toBe(68);
  });

  it("skips rows with invalid numeric values", () => {
    const csv = [
      "timestamp,speechText,valence,arousal,heartRate,skinConductance",
      "2026-04-12T08:30:00.000Z,bad row,nope,4,72,0.45",
      "2026-04-12T08:35:00.000Z,good row,6,5,70,0.40",
    ].join("\n");

    const result = parseSessionsCsv(csv);

    expect(result.importedCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(result.errors[0].message).toContain("Invalid valence");
  });
});
