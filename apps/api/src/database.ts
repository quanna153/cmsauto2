import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import "./config.js";

type QueryParams = Record<string, string | number | null> | (string | number | null)[];
type Row = Record<string, unknown>;

type SqlStatement = {
  step: () => boolean;
  getAsObject: () => Row;
  free: () => void;
};

export type SqlDatabase = {
  exec: (sql: string) => void;
  run: (sql: string, params?: unknown) => void;
  prepare: (sql: string, params?: unknown) => SqlStatement;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const sqliteFile = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(dataDir, "cmsauto.sqlite");

export const dataFilePaths = {
  dataDir,
  sqliteFile,
  historyFile: path.join(dataDir, "history.json"),
  articleLibraryFile: path.join(dataDir, "article-library.json"),
  volumeCacheFile: path.join(dataDir, "volume-cache.json"),
  promptsFile: path.join(dataDir, "prompts.json"),
  articlesFile: path.join(dataDir, "articles.json")
} as const;

const migrationV1 = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  language TEXT NOT NULL,
  seed_keyword TEXT NOT NULL,
  active_step TEXT NOT NULL,
  primary_keyword_id TEXT,
  review_status TEXT NOT NULL,
  review_note TEXT NOT NULL DEFAULT '',
  publish_at TEXT,
  published_at TEXT,
  live_path TEXT,
  remote_article_id TEXT,
  publish_job_id TEXT,
  last_publish_error TEXT,
  keyword_ideas_json TEXT NOT NULL DEFAULT '[]',
  secondary_keyword_ids_json TEXT NOT NULL DEFAULT '[]',
  brief_json TEXT,
  outline_json TEXT,
  draft_json TEXT,
  link_suggestions_json TEXT NOT NULL DEFAULT '[]',
  final_markdown TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_articles_updated_at ON articles(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_review_status ON articles(review_status);
CREATE INDEX IF NOT EXISTS idx_articles_owner_user_id ON articles(owner_user_id);

CREATE TABLE IF NOT EXISTS article_versions (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  label TEXT NOT NULL,
  review_status TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  markdown TEXT NOT NULL,
  FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_article_versions_article_id ON article_versions(article_id, created_at DESC);

CREATE TABLE IF NOT EXISTS article_status_transitions (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT NOT NULL,
  FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_article_status_transitions_article_id ON article_status_transitions(article_id, created_at DESC);

CREATE TABLE IF NOT EXISTS article_library (
  id TEXT PRIMARY KEY,
  revision INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  language TEXT NOT NULL,
  summary TEXT NOT NULL,
  keywords_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_article_library_language ON article_library(language);

CREATE TABLE IF NOT EXISTS prompt_templates (
  key TEXT PRIMARY KEY,
  revision INTEGER NOT NULL DEFAULT 1,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS history_records (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT,
  step TEXT NOT NULL,
  created_at TEXT NOT NULL,
  request_json TEXT NOT NULL,
  response_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_history_records_created_at ON history_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_records_owner_user_id ON history_records(owner_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS keyword_volume_cache (
  id TEXT PRIMARY KEY,
  keyword TEXT NOT NULL,
  language TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_label TEXT NOT NULL,
  monthly_volume INTEGER,
  status TEXT NOT NULL,
  checked_at TEXT,
  cached_at TEXT NOT NULL,
  UNIQUE(provider, language, keyword)
);

CREATE INDEX IF NOT EXISTS idx_keyword_volume_cache_lookup ON keyword_volume_cache(provider, language, cached_at DESC);

CREATE TABLE IF NOT EXISTS publish_jobs (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  status TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  locked_at TEXT,
  FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_publish_jobs_status_schedule ON publish_jobs(status, scheduled_at);

CREATE TABLE IF NOT EXISTS publish_logs (
  id TEXT PRIMARY KEY,
  publish_job_id TEXT NOT NULL,
  article_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(publish_job_id) REFERENCES publish_jobs(id) ON DELETE CASCADE,
  FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_publish_logs_job_id ON publish_logs(publish_job_id, created_at DESC);

CREATE TABLE IF NOT EXISTS published_articles (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL,
  locale TEXT NOT NULL,
  language TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  markdown TEXT NOT NULL,
  published_at TEXT NOT NULL,
  live_path TEXT NOT NULL,
  internal_links_json TEXT NOT NULL,
  primary_keyword TEXT NOT NULL,
  secondary_keywords_json TEXT NOT NULL,
  UNIQUE(locale, slug),
  FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_published_articles_live_path ON published_articles(live_path);
CREATE INDEX IF NOT EXISTS idx_published_articles_locale_date ON published_articles(locale, published_at DESC);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  must_change_password INTEGER NOT NULL DEFAULT 1,
  created_by_user_id TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  created_ip TEXT,
  user_agent TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  event_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
`;

let database: SqlDatabase | null = null;
let transactionQueue = Promise.resolve();

function normalizeParams(params: unknown) {
  if (!params || Array.isArray(params) || typeof params !== "object") {
    return params;
  }

  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key.replace(/^[$:@]/, ""), value])
  );
}

function makeStatement(statement: Database.Statement, params?: unknown): SqlStatement {
  const normalizedParams = normalizeParams(params);
  const iterator = params === undefined
    ? statement.iterate()
    : statement.iterate(normalizedParams as never);
  let row: Row = {};

  return {
    step() {
      const next = iterator.next();
      row = next.done ? {} : next.value as Row;
      return !next.done;
    },
    getAsObject() {
      return row;
    },
    free() {
      iterator.return?.();
    }
  };
}

function createAdapter(nativeDatabase: Database.Database): SqlDatabase {
  return {
    exec(sql) {
      nativeDatabase.exec(sql);
    },
    run(sql, params) {
      const statement = nativeDatabase.prepare(sql);
      if (params === undefined) {
        statement.run();
      } else {
        statement.run(normalizeParams(params) as never);
      }
    },
    prepare(sql, params) {
      return makeStatement(nativeDatabase.prepare(sql), params);
    }
  };
}

function migrate(nativeDatabase: Database.Database) {
  nativeDatabase.exec(migrationV1);
  nativeDatabase.prepare(`
    INSERT OR IGNORE INTO schema_migrations (version, applied_at)
    VALUES (1, ?)
  `).run(new Date().toISOString());
}

export async function getDatabase() {
  if (!database) {
    mkdirSync(path.dirname(sqliteFile), { recursive: true });
    const nativeDatabase = new Database(sqliteFile);
    nativeDatabase.pragma("foreign_keys = ON");
    nativeDatabase.pragma("journal_mode = WAL");
    migrate(nativeDatabase);
    database = createAdapter(nativeDatabase);
  }

  return database;
}

export async function persistDatabase(_database?: SqlDatabase) {
  // File-backed SQLite persists each committed transaction automatically.
}

export async function runStatement(sql: string, params?: QueryParams) {
  const db = await getDatabase();
  db.run(sql, params);
}

export async function queryAll<T extends Row>(sql: string, params?: QueryParams) {
  const db = await getDatabase();
  const statement = db.prepare(sql, params);
  const rows: T[] = [];

  try {
    while (statement.step()) {
      rows.push(statement.getAsObject() as T);
    }
  } finally {
    statement.free();
  }

  return rows;
}

export async function queryFirst<T extends Row>(sql: string, params?: QueryParams) {
  const rows = await queryAll<T>(sql, params);
  return rows[0] ?? null;
}

export async function tableCount(tableName: string) {
  const row = await queryFirst<{ count: number }>(`SELECT COUNT(*) AS count FROM ${tableName}`);
  return Number(row?.count ?? 0);
}

export async function withTransaction<T>(callback: (database: SqlDatabase) => T | Promise<T>) {
  const run = transactionQueue.then(async () => {
    const db = await getDatabase();
    db.exec("BEGIN IMMEDIATE");

    try {
      const result = await callback(db);
      db.exec("COMMIT");
      return result;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  });

  transactionQueue = run.then(() => undefined, () => undefined);
  return run;
}
