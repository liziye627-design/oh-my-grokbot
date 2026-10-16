import { CoreError } from "../errors.js";

export interface TeamChoice {
  readonly id: string;
  readonly description: string;
  readonly roles: readonly string[];
}

export interface TeamSelection {
  readonly available: readonly {
    readonly id: string;
    readonly description: string;
    readonly roles: readonly string[];
    readonly selected: boolean;
  }[];
  readonly selected: readonly string[];
  readonly installCommands: readonly string[];
}

export function selectTeams(
  teams: readonly TeamChoice[],
  requested: readonly string[],
): TeamSelection {
  const known = new Map(teams.map((team) => [team.id, team]));
  const unknown = requested.filter((id) => !known.has(id));
  if (unknown.length > 0) {
    throw new CoreError("INDUSTRY_NOT_FOUND", `Unknown team: ${unknown.join(", ")}`);
  }
  if (new Set(requested).size !== requested.length) {
    throw new CoreError("INDUSTRY_DUPLICATE", "The same team was selected more than once");
  }
  const chosen = new Set(requested);
  return {
    available: teams.map((team) => ({
      id: team.id,
      description: team.description,
      roles: team.roles,
      selected: chosen.has(team.id),
    })),
    selected: requested,
    installCommands: requested.map((id) => `install ${id}`),
  };
}
