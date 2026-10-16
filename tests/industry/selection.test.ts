import { expect, it } from "vitest";
import { CoreError } from "../../src/errors.js";
import { selectTeams } from "../../src/industry/selection.js";

const teams = [
  { id: "oh-my-content-studio", description: "内容", roles: ["producer"] },
  { id: "oh-my-reverse-lab", description: "逆向", roles: ["reverse-engineer"] },
] as const;

it("lists every team and installs nothing when the operator has not chosen", () => {
  const selection = selectTeams(teams, []);
  expect(selection.selected).toEqual([]);
  expect(selection.installCommands).toEqual([]);
  expect(selection.available.map((team) => team.selected)).toEqual([false, false]);
});

it("records only the teams the operator named", () => {
  const selection = selectTeams(teams, ["oh-my-reverse-lab"]);
  expect(selection.selected).toEqual(["oh-my-reverse-lab"]);
  expect(selection.installCommands).toEqual(["install oh-my-reverse-lab"]);
  expect(selection.available.find((team) => team.id === "oh-my-content-studio")?.selected).toBe(
    false,
  );
});

it("rejects an unknown team and a repeated team", () => {
  expect(() => selectTeams(teams, ["oh-my-missing"])).toThrow(CoreError);
  expect(() => selectTeams(teams, ["oh-my-reverse-lab", "oh-my-reverse-lab"])).toThrow(CoreError);
});
