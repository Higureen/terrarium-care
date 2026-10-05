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
BEGIN;

DO $$
DECLARE
    item RECORD;
    target_terrarium_id INTEGER;
    target_pet_id INTEGER;
BEGIN
    FOR item IN
        SELECT *
        FROM (
            VALUES
                (
                    'Rupūžės terariumas – ekspozicija C',
                    'Gilis',
                    'Bufo bufo',
                    'Dažniausiai stebimas prie slėptuvės.',
                    'Apžiūrėtas augintinis, matomų sužeidimų nepastebėta.',
                    18, 24, 50, 70
                ),
                (
                    'Voro terariumas – ekspozicija D',
                    'Šešėlis',
                    'Brachypelma hamorii',
                    'Terariume įrengta individuali slėptuvė.',
                    'Stebėtas prie slėptuvės, užfiksuotas įprastas judėjimas.',
                    22, 26, 50, 65
                ),
                (
                    'Gekono terariumas – ekspozicija E',
                    'Kopa',
                    'Eublepharis macularius',
                    'Aktyvesnė vakare, mėgsta slėptuvę.',
                    'Vakarinės apžiūros metu augintinė buvo aktyvi.',
                    24, 28, 40, 60
                )
        ) AS entries (
            terrarium_name,
            pet_name,
            species,
            pet_notes,
            care_notes,
            temp_min,
            temp_max,
            hum_min,
            hum_max
        )
    LOOP
        SELECT id INTO target_terrarium_id
        FROM terrariums
        WHERE name = item.terrarium_name
        ORDER BY id
        LIMIT 1;

        IF target_terrarium_id IS NULL THEN
            INSERT INTO terrariums (
                name, temperature_min, temperature_max,
                humidity_min, humidity_max, last_cleaned, notes
            )
            VALUES (
                item.terrarium_name,
                item.temp_min, item.temp_max,
                item.hum_min, item.hum_max,
                CURRENT_DATE - 1,
                'Demonstraciniai duomenys; sąlygų ribos skirtos API bandymui.'
            )
            RETURNING id INTO target_terrarium_id;
        END IF;

        SELECT id INTO target_pet_id
        FROM pets
        WHERE terrarium_id = target_terrarium_id
          AND name = item.pet_name
          AND species = item.species
        ORDER BY id
        LIMIT 1;

        IF target_pet_id IS NULL THEN
            INSERT INTO pets (
                terrarium_id, name, species, arrival_date, notes
            )
            VALUES (
                target_terrarium_id,
                item.pet_name,
                item.species,
                DATE '2026-09-15',
                item.pet_notes
            )
            RETURNING id INTO target_pet_id;
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM care_records
            WHERE pet_id = target_pet_id
              AND care_type = 'observation'
              AND notes = item.care_notes
        ) THEN
            INSERT INTO care_records (pet_id, care_type, notes)
            VALUES (
                target_pet_id,
                'observation',
                item.care_notes
            );
        END IF;
    END LOOP;
END;
$$;

COMMIT;