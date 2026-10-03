INSERT INTO terrariums (
    name,
    temperature_min,
    temperature_max,
    humidity_min,
    humidity_max,
    last_cleaned,
    notes
)
VALUES (
    'Varlių terariumas A',
    22,
    26,
    60,
    80,
    CURRENT_DATE,
    'Bandomasis terariumas API demonstracijai.'
)
RETURNING *;