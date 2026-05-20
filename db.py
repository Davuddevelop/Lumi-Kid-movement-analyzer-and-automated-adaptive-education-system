"""
Lumi SQLite Persistence Layer
Stores child progress, missions, interactions, badges, and XP.
"""
import sqlite3
import uuid
import json
from contextlib import contextmanager
from datetime import datetime

DB_PATH = "lumi.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS children (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pin TEXT,
    avatar_seed TEXT DEFAULT 'robot1',
    age INTEGER DEFAULT 6,
    xp INTEGER DEFAULT 0,
    created_at TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    child_id TEXT DEFAULT 'default',
    started_at TEXT,
    ended_at TEXT,
    focus_score INTEGER DEFAULT 50
);
CREATE TABLE IF NOT EXISTS mission_attempts (
    id TEXT PRIMARY KEY,
    child_id TEXT DEFAULT 'default',
    session_id TEXT,
    level_id INTEGER,
    result TEXT,
    commands TEXT,
    attempts INTEGER DEFAULT 1,
    hints_used INTEGER DEFAULT 0,
    stars INTEGER DEFAULT 0,
    duration_sec REAL DEFAULT 0,
    created_at TEXT
);
CREATE TABLE IF NOT EXISTS interactions (
    id TEXT PRIMARY KEY,
    child_id TEXT DEFAULT 'default',
    session_id TEXT,
    type TEXT,
    is_correct INTEGER,
    response_time_sec REAL,
    confidence TEXT,
    context TEXT,
    used_hint INTEGER DEFAULT 0,
    created_at TEXT
);
CREATE TABLE IF NOT EXISTS level_progress (
    child_id TEXT DEFAULT 'default',
    level_id INTEGER,
    stars INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    best_commands TEXT,
    PRIMARY KEY (child_id, level_id)
);
CREATE TABLE IF NOT EXISTS achievements_earned (
    child_id TEXT DEFAULT 'default',
    badge_id TEXT,
    earned_at TEXT,
    PRIMARY KEY (child_id, badge_id)
);
"""


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        conn.executescript(SCHEMA)
    # Ensure default child exists
    with get_db() as conn:
        conn.execute("""
            INSERT OR IGNORE INTO children (id, name, age, xp, created_at)
            VALUES ('default', 'Explorer', 6, 0, ?)
        """, (datetime.now().isoformat(),))


def get_child_xp(child_id='default') -> int:
    with get_db() as conn:
        row = conn.execute("SELECT xp FROM children WHERE id=?", (child_id,)).fetchone()
        return row['xp'] if row else 0


def add_xp(amount: int, child_id='default') -> int:
    with get_db() as conn:
        conn.execute("UPDATE children SET xp = xp + ? WHERE id=?", (amount, child_id))
        row = conn.execute("SELECT xp FROM children WHERE id=?", (child_id,)).fetchone()
        return row['xp'] if row else 0


def save_mission_attempt(level_id, result, commands, hints_used, stars, duration_sec,
                         child_id='default', session_id=None):
    with get_db() as conn:
        conn.execute("""
            INSERT INTO mission_attempts
            (id, child_id, session_id, level_id, result, commands, hints_used, stars, duration_sec, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?)
        """, (str(uuid.uuid4()), child_id, session_id, level_id, result,
              json.dumps(commands), hints_used, stars, duration_sec, datetime.now().isoformat()))


def save_level_progress(level_id, stars, completed, attempts, best_commands=None, child_id='default'):
    with get_db() as conn:
        conn.execute("""
            INSERT INTO level_progress (child_id, level_id, stars, completed, attempts, best_commands)
            VALUES (?,?,?,?,?,?)
            ON CONFLICT(child_id, level_id) DO UPDATE SET
                stars=MAX(stars, excluded.stars),
                completed=MAX(completed, excluded.completed),
                attempts=attempts+1,
                best_commands=COALESCE(excluded.best_commands, best_commands)
        """, (child_id, level_id, stars, 1 if completed else 0, attempts,
              json.dumps(best_commands) if best_commands else None))


def get_level_progress(child_id='default') -> dict:
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM level_progress WHERE child_id=?", (child_id,)
        ).fetchall()
        return {row['level_id']: dict(row) for row in rows}


def save_interaction(type_, is_correct, response_time_sec, confidence, context, used_hint,
                     child_id='default', session_id=None):
    with get_db() as conn:
        conn.execute("""
            INSERT INTO interactions
            (id, child_id, session_id, type, is_correct, response_time_sec, confidence, context, used_hint, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?)
        """, (str(uuid.uuid4()), child_id, session_id, type_,
              1 if is_correct else 0, response_time_sec, confidence, context,
              1 if used_hint else 0, datetime.now().isoformat()))


def get_recent_interactions(limit=100, child_id='default') -> list:
    with get_db() as conn:
        rows = conn.execute("""
            SELECT * FROM interactions WHERE child_id=?
            ORDER BY created_at DESC LIMIT ?
        """, (child_id, limit)).fetchall()
        return [dict(r) for r in reversed(rows)]


def save_badge(badge_id, child_id='default'):
    with get_db() as conn:
        conn.execute("""
            INSERT OR IGNORE INTO achievements_earned (child_id, badge_id, earned_at)
            VALUES (?,?,?)
        """, (child_id, badge_id, datetime.now().isoformat()))


def get_parent_stats(child_id='default') -> dict:
    with get_db() as conn:
        total_missions = conn.execute(
            "SELECT COUNT(*) as c FROM mission_attempts WHERE child_id=?", (child_id,)
        ).fetchone()['c']
        success_missions = conn.execute(
            "SELECT COUNT(*) as c FROM mission_attempts WHERE child_id=? AND result='success'", (child_id,)
        ).fetchone()['c']
        total_hints = conn.execute(
            "SELECT SUM(hints_used) as s FROM mission_attempts WHERE child_id=?", (child_id,)
        ).fetchone()['s'] or 0
        badges = conn.execute(
            "SELECT badge_id, earned_at FROM achievements_earned WHERE child_id=? ORDER BY earned_at DESC",
            (child_id,)
        ).fetchall()
        xp = get_child_xp(child_id)
        return {
            "total_missions": total_missions,
            "success_missions": success_missions,
            "success_rate": round(success_missions / total_missions * 100) if total_missions else 0,
            "total_hints": total_hints,
            "badges_count": len(badges),
            "badges": [dict(b) for b in badges],
            "xp": xp,
            "level": max(1, xp // 500 + 1),
        }
