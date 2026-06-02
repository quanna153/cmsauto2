import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("database fail-fast", () => {
  it("does not replace a corrupt sqlite file", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "cmsauto-corrupt-"));
    const databasePath = path.join(directory, "broken.sqlite");
    const original = Buffer.from("not-a-sqlite-database");
    writeFileSync(databasePath, original);

    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", "-e", "import('./src/database.ts').then((module) => module.getDatabase())"],
      { cwd: path.resolve("."), env: { ...process.env, DATABASE_PATH: databasePath }, encoding: "utf8" }
    );

    expect(result.status).not.toBe(0);
    expect(readFileSync(databasePath)).toEqual(original);
    rmSync(directory, { recursive: true, force: true });
  });
});

