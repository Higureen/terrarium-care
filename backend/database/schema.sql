BEGIN;

CREATE TABLE terrariums (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (length(trim(name)) > 0),
    temperature_min NUMERIC(5, 2) NOT NULL,
    temperature_max NUMERIC(5, 2) NOT NULL,
    humidity_min NUMERIC(5, 2) NOT NULL,
    humidity_max NUMERIC(5, 2) NOT NULL,
    last_cleaned DATE,
    notes TEXT,

    CHECK (temperature_min <= temperature_max),
    CHECK (humidity_min BETWEEN 0 AND 100),
    CHECK (humidity_max BETWEEN 0 AND 100),
    CHECK (humidity_min <= humidity_max)
);

CREATE TABLE pets (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    terrarium_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL CHECK (length(trim(name)) > 0),
    species VARCHAR(150) NOT NULL CHECK (length(trim(species)) > 0),
    arrival_date DATE,
    notes TEXT,

    CONSTRAINT fk_pet_terrarium
        FOREIGN KEY (terrarium_id)
        REFERENCES terrariums(id)
        ON DELETE RESTRICT
);

CREATE TABLE care_records (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pet_id INTEGER NOT NULL,
    care_type VARCHAR(30) NOT NULL,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NOT NULL CHECK (length(trim(notes)) > 0),

    CONSTRAINT fk_record_pet
        FOREIGN KEY (pet_id)
        REFERENCES pets(id)
        ON DELETE RESTRICT,

    CHECK (care_type IN ('feeding', 'observation', 'other'))
);

CREATE INDEX idx_pets_terrarium_id ON pets(terrarium_id);
CREATE INDEX idx_care_records_pet_id ON care_records(pet_id);

COMMIT;