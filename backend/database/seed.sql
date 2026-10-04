BEGIN;

DO $$
DECLARE
    frog_terrarium_id INTEGER;
    lizard_terrarium_id INTEGER;
    pupa_id INTEGER;
    meta_id INTEGER;
    smilga_id INTEGER;
BEGIN
    -- Apsauga nuo pakartotinio šio duomenų rinkinio įkėlimo.
    IF EXISTS (
        SELECT 1
        FROM terrariums
        WHERE name = 'Varlių terariumas – ekspozicija A'
    ) THEN
        RAISE NOTICE 'Pradiniai duomenys jau įkelti.';
        RETURN;
    END IF;

    INSERT INTO terrariums (
        name, temperature_min, temperature_max,
        humidity_min, humidity_max, last_cleaned, notes
    )
    VALUES (
        'Varlių terariumas – ekspozicija A',
        22, 26, 60, 80, CURRENT_DATE - 2,
        'Terariumas su šakomis ir slėptuvėmis. Demonstraciniai duomenys.'
    )
    RETURNING id INTO frog_terrarium_id;

    INSERT INTO terrariums (
        name, temperature_min, temperature_max,
        humidity_min, humidity_max, last_cleaned, notes
    )
    VALUES (
        'Driežo terariumas – ekspozicija B',
        24, 28, 40, 60, CURRENT_DATE - 1,
        'Terariumas su slėptuve. Demonstraciniai duomenys.'
    )
    RETURNING id INTO lizard_terrarium_id;

    INSERT INTO pets (
        terrarium_id, name, species, arrival_date, notes
    )
    VALUES (
        frog_terrarium_id, 'Pupa', 'Litoria caerulea',
        '2026-09-01', 'Dažniausiai stebima ant viršutinės šakos.'
    )
    RETURNING id INTO pupa_id;

    INSERT INTO pets (
        terrarium_id, name, species, arrival_date, notes
    )
    VALUES (
        frog_terrarium_id, 'Mėta', 'Litoria caerulea',
        '2026-09-05', 'Mėgsta slėptuvę tarp augalų.'
    )
    RETURNING id INTO meta_id;

    INSERT INTO pets (
        terrarium_id, name, species, arrival_date, notes
    )
    VALUES (
        lizard_terrarium_id, 'Smilga', 'Eublepharis macularius',
        '2026-08-20', 'Aktyvesnė vakare.'
    )
    RETURNING id INTO smilga_id;

    INSERT INTO care_records (
        pet_id, care_type, performed_at, notes
    )
    VALUES
        (
            pupa_id, 'feeding',
            CURRENT_TIMESTAMP - INTERVAL '1 day',
            'Pasiūlytas maistas, augintinė jį priėmė.'
        ),
        (
            pupa_id, 'observation',
            CURRENT_TIMESTAMP - INTERVAL '2 hours',
            'Aktyvi, išorinių pakitimų nepastebėta.'
        ),
        (
            meta_id, 'observation',
            CURRENT_TIMESTAMP - INTERVAL '3 hours',
            'Stebėta slėptuvėje, matomų sužeidimų nėra.'
        ),
        (
            smilga_id, 'feeding',
            CURRENT_TIMESTAMP - INTERVAL '1 day',
            'Pamaitinta, maistą priėmė.'
        ),
        (
            smilga_id, 'other',
            CURRENT_TIMESTAMP - INTERVAL '1 hour',
            'Pašalinti maisto likučiai iš augintinės slėptuvės.'
        );
END;
$$;

COMMIT;