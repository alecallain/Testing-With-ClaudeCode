import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Member, Chore, Completion, StoreState } from '../src/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'chores.db');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Migrate from single assigneeId to assigneeIds JSON array if needed
const choreColumns = (
  db.prepare('PRAGMA table_info(chores)').all() as { name: string }[]
).map((c) => c.name);
if (choreColumns.includes('assigneeId')) {
  db.exec(`
    BEGIN TRANSACTION;
      ALTER TABLE chores RENAME TO chores_old;
      CREATE TABLE chores (
        id             TEXT PRIMARY KEY,
        title          TEXT NOT NULL,
        description    TEXT NOT NULL DEFAULT '',
        assigneeIds    TEXT NOT NULL DEFAULT '[]',
        color          TEXT NOT NULL,
        startDate      TEXT NOT NULL,
        endDate        TEXT,
        difficulty     INTEGER NOT NULL DEFAULT 1,
        recurrenceType TEXT NOT NULL DEFAULT 'none',
        recurrenceDays TEXT NOT NULL DEFAULT '[]',
        recurrenceDay  INTEGER
      );
      INSERT INTO chores SELECT id, title, description,
        CASE WHEN assigneeId IS NULL THEN '[]' ELSE json_array(assigneeId) END,
        color, startDate, endDate, difficulty, recurrenceType, recurrenceDays, recurrenceDay
      FROM chores_old;
      DROP TABLE chores_old;
    COMMIT;
  `);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id    TEXT PRIMARY KEY,
    name  TEXT NOT NULL,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chores (
    id             TEXT PRIMARY KEY,
    title          TEXT NOT NULL,
    description    TEXT NOT NULL DEFAULT '',
    assigneeIds    TEXT NOT NULL DEFAULT '[]',
    color          TEXT NOT NULL,
    startDate      TEXT NOT NULL,
    endDate        TEXT,
    difficulty     INTEGER NOT NULL DEFAULT 1,
    recurrenceType TEXT NOT NULL DEFAULT 'none',
    recurrenceDays TEXT NOT NULL DEFAULT '[]',
    recurrenceDay  INTEGER
  );

  CREATE TABLE IF NOT EXISTS completions (
    id          TEXT PRIMARY KEY,
    choreId     TEXT NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
    date        TEXT NOT NULL,
    completedAt TEXT NOT NULL,
    UNIQUE(choreId, date)
  );
`);

// --- Row types (raw SQLite rows before mapping) ---

interface MemberRow {
  id: string;
  name: string;
  color: string;
}

interface ChoreRow {
  id: string;
  title: string;
  description: string;
  assigneeIds: string; // JSON array string, e.g. '["id1","id2"]'
  color: string;
  startDate: string;
  endDate: string | null;
  difficulty: number;
  recurrenceType: string;
  recurrenceDays: string;
  recurrenceDay: number | null;
}

interface CompletionRow {
  id: string;
  choreId: string;
  date: string;
  completedAt: string;
}

// --- Mapping helpers ---

function rowToChore(row: ChoreRow): Chore {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    assigneeIds: JSON.parse(row.assigneeIds) as string[],
    color: row.color,
    startDate: row.startDate,
    endDate: row.endDate,
    difficulty: row.difficulty,
    recurrence: {
      type: row.recurrenceType as Chore['recurrence']['type'],
      daysOfWeek: JSON.parse(row.recurrenceDays) as number[],
      dayOfMonth: row.recurrenceDay,
    },
  };
}

// --- Query helpers ---

export function getAllMembers(): Member[] {
  return (db.prepare('SELECT * FROM members').all() as MemberRow[]);
}

export function insertMember(member: Member): void {
  db.prepare('INSERT INTO members (id, name, color) VALUES (?, ?, ?)').run(
    member.id,
    member.name,
    member.color,
  );
}

export function deleteMember(id: string): Chore[] {
  db.prepare('DELETE FROM members WHERE id = ?').run(id);
  const all = getAllChores();
  const stmt = db.prepare('UPDATE chores SET assigneeIds = ? WHERE id = ?');
  for (const chore of all.filter((c) => c.assigneeIds.includes(id))) {
    stmt.run(JSON.stringify(chore.assigneeIds.filter((mid) => mid !== id)), chore.id);
  }
  return getAllChores();
}

export function getAllChores(): Chore[] {
  return (db.prepare('SELECT * FROM chores').all() as ChoreRow[]).map(rowToChore);
}

export function insertChore(chore: Chore): void {
  db.prepare(`
    INSERT INTO chores
      (id, title, description, assigneeIds, color, startDate, endDate, difficulty,
       recurrenceType, recurrenceDays, recurrenceDay)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    chore.id,
    chore.title,
    chore.description,
    JSON.stringify(chore.assigneeIds),
    chore.color,
    chore.startDate,
    chore.endDate,
    chore.difficulty,
    chore.recurrence.type,
    JSON.stringify(chore.recurrence.daysOfWeek),
    chore.recurrence.dayOfMonth,
  );
}

export function updateChore(chore: Chore): void {
  db.prepare(`
    UPDATE chores SET
      title = ?, description = ?, assigneeIds = ?, color = ?,
      startDate = ?, endDate = ?, difficulty = ?,
      recurrenceType = ?, recurrenceDays = ?, recurrenceDay = ?
    WHERE id = ?
  `).run(
    chore.title,
    chore.description,
    JSON.stringify(chore.assigneeIds),
    chore.color,
    chore.startDate,
    chore.endDate,
    chore.difficulty,
    chore.recurrence.type,
    JSON.stringify(chore.recurrence.daysOfWeek),
    chore.recurrence.dayOfMonth,
    chore.id,
  );
}

export function deleteChore(id: string): void {
  db.prepare('DELETE FROM chores WHERE id = ?').run(id);
}

export function getAllCompletions(): Completion[] {
  return db.prepare('SELECT * FROM completions').all() as CompletionRow[];
}

export function toggleCompletion(
  completion: Completion,
): 'added' | 'removed' {
  const result = db.prepare(`
    INSERT INTO completions (id, choreId, date, completedAt)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(choreId, date) DO NOTHING
  `).run(completion.id, completion.choreId, completion.date, completion.completedAt);

  if (result.changes === 0) {
    // Already existed — remove it
    db.prepare('DELETE FROM completions WHERE choreId = ? AND date = ?').run(
      completion.choreId,
      completion.date,
    );
    return 'removed';
  }
  return 'added';
}

export function getState(): StoreState {
  return {
    members: getAllMembers(),
    chores: getAllChores(),
    completions: getAllCompletions(),
  };
}

export function getCompletionByChoreAndDate(
  choreId: string,
  date: string,
): Completion | undefined {
  return db
    .prepare('SELECT * FROM completions WHERE choreId = ? AND date = ?')
    .get(choreId, date) as Completion | undefined;
}
