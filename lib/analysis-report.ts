import type { AnalysisData, StatsSummary } from "./types";

const METRIC_LABELS = {
  sentimentScore: "AI Sentiment",
  valence: "Valence",
  arousal: "Arousal",
  heartRate: "Heart Rate",
  skinConductance: "Skin Conductance",
} as const;

export function generateAnalysisReportHtml(analysisData: AnalysisData): string {
  const generatedAt = new Date();
  const recentSessions = [...analysisData.sessions]
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 50);

  const statsRows = Object.entries(analysisData.stats)
    .map(([key, stats]) => renderStatsRow(METRIC_LABELS[key as keyof typeof METRIC_LABELS], stats))
    .join("");

  const correlationRows = analysisData.correlations
    .map(
      (correlation) => `
        <tr>
          <td>${escapeHtml(correlation.variableX)}</td>
          <td>${escapeHtml(correlation.variableY)}</td>
          <td>${correlation.r.toFixed(3)}</td>
          <td>${correlation.n}</td>
          <td>${escapeHtml(correlation.interpretation)}</td>
        </tr>
      `,
    )
    .join("");

  const sessionRows = recentSessions
    .map(
      (session) => `
        <tr>
          <td>${escapeHtml(formatDateTime(session.timestamp))}</td>
          <td>${escapeHtml(session.speech.text || "-")}</td>
          <td>${session.speech.sentimentScore.toFixed(3)}</td>
          <td>${session.selfReport.valence.toFixed(2)}</td>
          <td>${session.selfReport.arousal.toFixed(2)}</td>
          <td>${session.biometrics.heartRate.toFixed(0)}</td>
          <td>${session.biometrics.skinConductance.toFixed(2)}</td>
        </tr>
      `,
    )
    .join("");

  const truncatedNotice =
    analysisData.sessions.length > recentSessions.length
      ? `<p class="muted">Showing the latest ${recentSessions.length} of ${analysisData.sessions.length} sessions.</p>`
      : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>EmotionLab Analysis Report</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #152033;
        --muted: #5b6678;
        --line: #d8deea;
        --panel: #f7f9fc;
        --accent: #2357ff;
        --good: #0f9d77;
        --warn: #e59a18;
        --bad: #d64545;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 32px;
        font-family: Arial, Helvetica, sans-serif;
        color: var(--ink);
        background: #ffffff;
      }

      h1, h2 {
        margin: 0 0 12px;
      }

      h1 {
        font-size: 28px;
      }

      h2 {
        margin-top: 28px;
        font-size: 18px;
      }

      p {
        margin: 0;
      }

      .muted {
        color: var(--muted);
        font-size: 12px;
      }

      .summary {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-top: 20px;
      }

      .card {
        padding: 16px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: var(--panel);
      }

      .card-label {
        margin-bottom: 8px;
        font-size: 11px;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .card-value {
        font-size: 24px;
        font-weight: 700;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;
      }

      th, td {
        padding: 10px 12px;
        border: 1px solid var(--line);
        text-align: left;
        vertical-align: top;
        font-size: 12px;
      }

      th {
        background: #edf2ff;
        font-weight: 700;
      }

      .footer {
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid var(--line);
      }
    </style>
  </head>
  <body>
    <h1>EmotionLab Analysis Report</h1>
    <p class="muted">Generated ${escapeHtml(formatDateTime(generatedAt.toISOString()))}</p>

    <section class="summary">
      <div class="card">
        <div class="card-label">Sessions</div>
        <div class="card-value">${analysisData.sessions.length}</div>
      </div>
      <div class="card">
        <div class="card-label">Avg Sentiment</div>
        <div class="card-value">${analysisData.stats.sentimentScore.mean.toFixed(2)}</div>
      </div>
      <div class="card">
        <div class="card-label">Avg Valence</div>
        <div class="card-value">${analysisData.stats.valence.mean.toFixed(2)}</div>
      </div>
      <div class="card">
        <div class="card-label">Avg Heart Rate</div>
        <div class="card-value">${analysisData.stats.heartRate.mean.toFixed(0)} bpm</div>
      </div>
    </section>

    <h2>Metric Summary</h2>
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Count</th>
          <th>Mean</th>
          <th>SD</th>
          <th>Min</th>
          <th>Max</th>
        </tr>
      </thead>
      <tbody>${statsRows}</tbody>
    </table>

    <h2>Correlations</h2>
    <table>
      <thead>
        <tr>
          <th>Metric A</th>
          <th>Metric B</th>
          <th>r</th>
          <th>n</th>
          <th>Interpretation</th>
        </tr>
      </thead>
      <tbody>${correlationRows}</tbody>
    </table>

    <h2>Recent Sessions</h2>
    ${truncatedNotice}
    <table>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Speech Text</th>
          <th>Sentiment</th>
          <th>Valence</th>
          <th>Arousal</th>
          <th>HR</th>
          <th>SC</th>
        </tr>
      </thead>
      <tbody>${sessionRows}</tbody>
    </table>

    <div class="footer">
      <p class="muted">
        This report summarizes the currently stored sessions in EmotionLab.
      </p>
    </div>
  </body>
</html>`;
}

function renderStatsRow(label: string, stats: StatsSummary): string {
  return `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td>${stats.count}</td>
      <td>${stats.mean.toFixed(3)}</td>
      <td>${stats.stdDev.toFixed(3)}</td>
      <td>${stats.min.toFixed(3)}</td>
      <td>${stats.max.toFixed(3)}</td>
    </tr>
  `;
}

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
