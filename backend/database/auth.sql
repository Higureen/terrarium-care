BEGIN;

CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (btrim(name) <> ''),
    email VARCHAR(254) NOT NULL CHECK (btrim(email) <> ''),
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'worker'
        CHECK (role IN ('worker', 'manager', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX users_email_unique
    ON users (LOWER(email));

CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX auth_sessions_user_id_idx
    ON auth_sessions(user_id);

ALTER TABLE care_records
    ADD COLUMN created_by INTEGER
    REFERENCES users(id) ON DELETE RESTRICT;

CREATE INDEX care_records_created_by_idx
    ON care_records(created_by);

COMMIT;