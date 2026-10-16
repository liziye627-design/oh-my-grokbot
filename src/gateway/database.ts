import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { CoreError } from "../errors.js";

export class Ledger {
  readonly db: DatabaseSync;
  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY, tenant TEXT NOT NULL, run TEXT UNIQUE NOT NULL, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS events(tenant TEXT, source TEXT, id TEXT, digest TEXT NOT NULL, task TEXT REFERENCES tasks(id), PRIMARY KEY(tenant,source,id));
      CREATE TABLE IF NOT EXISTS credentials(digest TEXT PRIMARY KEY, tenant TEXT, task TEXT REFERENCES tasks(id), run TEXT, actor TEXT, expires INTEGER, revoked INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS artifacts(id TEXT PRIMARY KEY, tenant TEXT, task TEXT REFERENCES tasks(id), name TEXT, data TEXT NOT NULL, UNIQUE(task,name));
      CREATE TABLE IF NOT EXISTS approvals(id TEXT PRIMARY KEY, tenant TEXT, task TEXT REFERENCES tasks(id), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY, tenant TEXT, task TEXT REFERENCES tasks(id), state TEXT, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS reports(seq INTEGER PRIMARY KEY AUTOINCREMENT, tenant TEXT, task TEXT, run TEXT, actor TEXT, kind TEXT, message TEXT, at INTEGER);
      CREATE TABLE IF NOT EXISTS audit(seq INTEGER PRIMARY KEY AUTOINCREMENT, tenant TEXT, task TEXT, actor TEXT, event TEXT, at INTEGER);
      PRAGMA user_version=1;`);
  }
  transaction<T>(action: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = action();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  get(sql: string, ...args: SQLInputValue[]) {
    return this.db.prepare(sql).get(...args);
  }
  all(sql: string, ...args: SQLInputValue[]) {
    return this.db.prepare(sql).all(...args);
  }
  run(sql: string, ...args: SQLInputValue[]) {
    return this.db.prepare(sql).run(...args);
  }
  audit(tenant: string, task: string, actor: string, event: string, now: number): void {
    this.run(
      "INSERT INTO audit(tenant,task,actor,event,at) VALUES(?,?,?,?,?)",
      tenant,
      task,
      actor,
      event,
      now,
    );
  }
  recoverDeliveries(): void {
    this.db.exec(
      "UPDATE outbox SET state='needs_human', data=json_set(data,'$.state','needs_human') WHERE state='sending'",
    );
  }
  close(): void {
    this.db.close();
  }
}
export function jsonColumn(row: Record<string, unknown> | undefined): unknown {
  const { data } = row ?? {};
  if (typeof data !== "string")
    throw new CoreError("NOT_FOUND", "Resource is unavailable in this scope");
  const value: unknown = JSON.parse(data);
  return value;
}
