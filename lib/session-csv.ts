import Papa from "papaparse";

import { analyzeSentiment } from "./sentiment";
import type { Session } from "./types";

const COLUMN_ALIASES = {
  timestamp: ["timestamp", "datetime", "date", "recordedat", "recorded_at", "createdat"],
  speechText: ["speechtext", "speech", "text", "transcript", "utterance", "note", "memo"],
  valence: ["valence", "v"],
  arousal: ["arousal", "a"],
  heartRate: ["heartrate", "heart_rate", "hr", "pulse"],
  skinConductance: ["skinconductance", "skin_conductance", "sc", "gsr", "eda"],
} as const;

export const SESSION_CSV_COLUMNS =
  "timestamp,speechText,valence,arousal,heartRate,skinConductance";

export type CsvImportError = {
  row: number;
  message: string;
};

export type CsvImportResult = {
  sessions: Session[];
  importedCount: number;
  skippedCount: number;
  errors: CsvImportError[];
};

type CsvRow = Record<string, string | undefined>;

export function parseSessionsCsv(csvText: string): CsvImportResult {
  const parseResult = Papa.parse<Record<string, string | undefined>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
  });

  const sessions: Session[] = [];
  const skippedRows = new Set<string>();
  const errors: CsvImportError[] = parseResult.errors.map((error, index) => {
    const row = typeof error.row === "number" ? error.row + 2 : 0;
    skippedRows.add(row > 0 ? String(row) : `parse-${index}`);

    return {
      row,
      message: error.message,
    };
  });

  parseResult.data.forEach((rawRow, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const row = normalizeRow(rawRow);

    if (!hasRowData(row)) {
      return;
    }

    try {
      const timestamp = parseTimestamp(getValue(row, COLUMN_ALIASES.timestamp), rowNumber);
      const speechText = (getValue(row, COLUMN_ALIASES.speechText) ?? "").trim();
      const valence = parseNumber(getValue(row, COLUMN_ALIASES.valence), "valence", rowNumber);
      const arousal = parseNumber(getValue(row, COLUMN_ALIASES.arousal), "arousal", rowNumber);
      const heartRate = parseNumber(getValue(row, COLUMN_ALIASES.heartRate), "heartRate", rowNumber);
      const skinConductance = parseNumber(
        getValue(row, COLUMN_ALIASES.skinConductance),
        "skinConductance",
        rowNumber,
      );
      const sentiment = analyzeSentiment(speechText);

      sessions.push({
        id: uuid(),
        timestamp,
        speech: {
          text: speechText,
          sentimentScore: sentiment.score,
          sentimentLabel: sentiment.label,
        },
        selfReport: {
          valence,
          arousal,
        },
        biometrics: {
          heartRate,
          skinConductance,
        },
      });
    } catch (error) {
      skippedRows.add(String(rowNumber));
      errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : "Unknown row error",
      });
    }
  });

  return {
    sessions,
    importedCount: sessions.length,
    skippedCount: skippedRows.size,
    errors,
  };
}

function normalizeRow(rawRow: Record<string, string | undefined>): CsvRow {
  const normalizedRow: CsvRow = {};

  Object.entries(rawRow).forEach(([key, value]) => {
    normalizedRow[normalizeKey(key)] = typeof value === "string" ? value.trim() : undefined;
  });

  return normalizedRow;
}

function hasRowData(row: CsvRow): boolean {
  return Object.values(row).some((value) => Boolean(value && value.trim().length > 0));
}

function getValue(row: CsvRow, aliases: readonly string[]): string | undefined {
  for (const alias of aliases) {
    const value = row[normalizeKey(alias)];
    if (value !== undefined && value !== "") {
      return value;
    }
  }

  return undefined;
}

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseTimestamp(value: string | undefined, rowNumber: number): string {
  if (!value) {
    return new Date().toISOString();
  }

  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`Invalid timestamp at row ${rowNumber}`);
  }

  return timestamp.toISOString();
}

function parseNumber(value: string | undefined, fieldName: string, rowNumber: number): number {
  if (!value) {
    throw new Error(`Missing ${fieldName}`);
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${fieldName} value "${value}"`);
  }

  return parsed;
}

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = (Math.random() * 16) | 0;
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
