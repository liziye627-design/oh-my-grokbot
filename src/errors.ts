export class CoreError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "CoreError";
  }
}

export function assertNever(value: never): never {
  throw new CoreError("UNREACHABLE", `Unexpected variant: ${String(value)}`);
}
