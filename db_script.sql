-- ============================================================
-- LifeOS Database — Full Table Creation Script
-- PostgreSQL | UUID Primary Keys | No Migration Needed
-- Run: psql -U postgres -d lifeos_db -f create_tables.sql
-- ============================================================

-- UUID extension enable করো (PostgreSQL এ একবারই করতে হবে)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name   VARCHAR(150)        NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255)      NOT NULL,
    timezone    VARCHAR(50)         NOT NULL DEFAULT 'UTC',
    created_at  TIMESTAMP           NOT NULL DEFAULT NOW(),
    last_login  TIMESTAMP
);


-- ============================================================
-- 2. USER SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    daily_reminder  BOOLEAN      NOT NULL DEFAULT TRUE,
    privacy_mode    VARCHAR(20)  NOT NULL DEFAULT 'normal',   -- normal / private
    week_start_day  VARCHAR(10)  NOT NULL DEFAULT 'monday',   -- monday / sunday
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_user_settings_user UNIQUE (user_id)
);


-- ============================================================
-- 3. DAILY STATE
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_state (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date         DATE NOT NULL,
    energy_level VARCHAR(10),   -- low / medium / high
    mood         VARCHAR(10),   -- happy / neutral / sad / angry / stressed
    self_rating  SMALLINT CHECK (self_rating BETWEEN 1 AND 5),
    note         TEXT,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_daily_state_user_date UNIQUE (user_id, date)
);


-- ============================================================
-- 4. LIFE AREAS  (seed data: Work, Health, Mind, Personal)
-- ============================================================
CREATE TABLE IF NOT EXISTS life_areas (
    id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL
);


-- ============================================================
-- 5. LIFE AREA STATUS
-- ============================================================
CREATE TABLE IF NOT EXISTS life_area_status (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    life_area_id UUID NOT NULL REFERENCES life_areas(id)  ON DELETE CASCADE,
    date         DATE NOT NULL,
    status       VARCHAR(10) NOT NULL,  -- good / ok / bad
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_life_area_status_user_area_date UNIQUE (user_id, life_area_id, date)
);


-- ============================================================
-- 6. DISTRACTIONS  (seed data: Social Media, YouTube …)
-- ============================================================
CREATE TABLE IF NOT EXISTS distractions (
    id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL
);


-- ============================================================
-- 7. DAILY DISTRACTION LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_distraction_log (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID NOT NULL REFERENCES users(id)        ON DELETE CASCADE,
    distraction_id UUID NOT NULL REFERENCES distractions(id) ON DELETE CASCADE,
    date           DATE NOT NULL,
    intensity      VARCHAR(10) NOT NULL,   -- low / medium / high
    created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 8. EXCUSES  (seed data: Too tired, No time …)
-- ============================================================
CREATE TABLE IF NOT EXISTS excuses (
    id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reason VARCHAR(150) UNIQUE NOT NULL
);


-- ============================================================
-- 9. DAILY EXCUSE LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_excuse_log (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    excuse_id  UUID NOT NULL REFERENCES excuses(id)  ON DELETE CASCADE,
    date       DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 10. HABITS
-- ============================================================
CREATE TABLE IF NOT EXISTS habits (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(100) NOT NULL,
    category   VARCHAR(50)  NOT NULL,   -- health / skill / mind
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 11. HABIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS habit_logs (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id   UUID    NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date       DATE    NOT NULL,
    status     BOOLEAN NOT NULL,   -- TRUE = done, FALSE = skipped
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_habit_log_habit_date UNIQUE (habit_id, date)
);


-- ============================================================
-- 12. PRODUCTIVITY FEELING
-- ============================================================
CREATE TABLE IF NOT EXISTS productivity_feeling (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date       DATE        NOT NULL,
    level      VARCHAR(10) NOT NULL,   -- 0-2h / 2-4h / 4-6h / 6h+
    created_at TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_productivity_user_date UNIQUE (user_id, date)
);


-- ============================================================
-- 13. WEEKLY SUMMARY
-- ============================================================
CREATE TABLE IF NOT EXISTS weekly_summary (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start      DATE        NOT NULL,
    week_end        DATE        NOT NULL,
    overall_status  VARCHAR(10),        -- green / yellow / red
    dominant_mood   VARCHAR(50),
    top_distraction VARCHAR(100),
    top_excuse      VARCHAR(100),
    average_energy  VARCHAR(20),
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_weekly_summary_user_week UNIQUE (user_id, week_start)
);


-- ============================================================
-- 14. STREAKS
-- ============================================================
CREATE TABLE IF NOT EXISTS streaks (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type          VARCHAR(50) NOT NULL,   -- daily_checkin / habit
    current_count INTEGER     NOT NULL DEFAULT 0,
    max_count     INTEGER     NOT NULL DEFAULT 0,
    updated_at    TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_streak_user_type UNIQUE (user_id, type)
);


-- ============================================================
-- INDEXES — query fast করার জন্য
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_daily_state_user_date       ON daily_state          (user_id, date);
CREATE INDEX IF NOT EXISTS idx_life_area_status_user_date  ON life_area_status     (user_id, date);
CREATE INDEX IF NOT EXISTS idx_distraction_log_user_date   ON daily_distraction_log(user_id, date);
CREATE INDEX IF NOT EXISTS idx_excuse_log_user_date        ON daily_excuse_log     (user_id, date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date       ON habit_logs           (habit_id, date);
CREATE INDEX IF NOT EXISTS idx_productivity_user_date      ON productivity_feeling (user_id, date);
CREATE INDEX IF NOT EXISTS idx_weekly_summary_user         ON weekly_summary       (user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_streaks_user                ON streaks              (user_id);


-- ============================================================
-- SEED DATA — Default values
-- ============================================================

-- Life Areas
INSERT INTO life_areas (name) VALUES
    ('Work'),
    ('Health'),
    ('Mind'),
    ('Personal')
ON CONFLICT (name) DO NOTHING;

-- Distractions
INSERT INTO distractions (name) VALUES
    ('Social Media'),
    ('YouTube'),
    ('Phone Scrolling'),
    ('TV / Netflix'),
    ('Gaming'),
    ('Unnecessary Browsing'),
    ('Gossip')
ON CONFLICT (name) DO NOTHING;

-- Excuses
INSERT INTO excuses (reason) VALUES
    ('Too tired'),
    ('No time'),
    ('Not motivated'),
    ('Too stressed'),
    ('Will do it tomorrow'),
    ('Not feeling well'),
    ('Too busy')
ON CONFLICT (reason) DO NOTHING;


-- ============================================================
-- DONE
-- ============================================================
SELECT 'LifeOS database setup complete!' AS status;