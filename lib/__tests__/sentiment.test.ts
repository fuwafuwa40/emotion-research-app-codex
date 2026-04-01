import { describe, it, expect } from "vitest";
import { analyzeSentiment } from "../sentiment";

describe("analyzeSentiment", () => {
  it("positive text returns positive label", () => {
    const r = analyzeSentiment("今日はとても嬉しい一日でした。楽しい時間を過ごしました。");
    expect(r.label).toBe("positive");
    expect(r.score).toBeGreaterThan(0);
  });
  it("negative text returns negative label", () => {
    const r = analyzeSentiment("とても悲しい出来事がありました。辛いです。");
    expect(r.label).toBe("negative");
    expect(r.score).toBeLessThan(0);
  });
  it("neutral text returns neutral label", () => {
    const r = analyzeSentiment("今日は普通の一日でした。");
    expect(r.label).toBe("neutral");
  });
  it("negation inverts sentiment", () => {
    const r = analyzeSentiment("嬉しくない");
    expect(r.label).toBe("negative");
  });
});
