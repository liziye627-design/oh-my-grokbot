import { expect, it } from "vitest";
import { scoreTimeWindow } from "../../src/industry/value.js";

it("keeps a window only when timed minutes stay positive and no run is all crisis", () => {
  expect(
    scoreTimeWindow([
      { baselineMinutes: 15, spentMinutes: 7, reviewMinutes: 0, crisisEveryLine: false },
    ]),
  ).toEqual({ status: "kept", netMinutes: 8 });
  expect(
    scoreTimeWindow([
      { baselineMinutes: 15, spentMinutes: 7, reviewMinutes: 3, crisisEveryLine: true },
    ]),
  ).toEqual({ status: "failed", netMinutes: 5, reason: "crisis" });
  expect(
    scoreTimeWindow([
      { baselineMinutes: 15, spentMinutes: 10, reviewMinutes: 8, crisisEveryLine: false },
    ]),
  ).toEqual({ status: "failed", netMinutes: -3, reason: "non_positive" });
  expect(
    scoreTimeWindow([
      { baselineMinutes: null, spentMinutes: 0, reviewMinutes: 0, crisisEveryLine: false },
    ]),
  ).toEqual({ status: "unknown" });
});
