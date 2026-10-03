const express = require("express");
const pool = require("../db");

const router = express.Router();

// Gauti visų augintinių sąrašą.
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                terrarium_id,
                name,
                species,
                to_char(arrival_date, 'YYYY-MM-DD') AS arrival_date,
                notes
            FROM pets
            ORDER BY id
        `);

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error("Failed to fetch pets:", error.message);

        return res.status(500).json({
            error: "Nepavyko gauti augintinių sąrašo."
        });
    }
});

// Sukurti augintinį.
router.post("/", async (req, res) => {
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return res.status(422).json({
            error: "Reikia pateikti JSON objektą."
        });
    }

    const {
        terrarium_id,
        name,
        species,
        arrival_date = null,
        notes = null
    } = body;

    if (
        !Number.isInteger(terrarium_id) ||
        terrarium_id < 1 ||
        terrarium_id > 2147483647
    ) {
        return res.status(422).json({
            error: "Terariumo ID turi būti teigiamas sveikasis skaičius."
        });
    }

    if (
        typeof name !== "string" ||
        name.trim().length === 0 ||
        name.trim().length > 100
    ) {
        return res.status(422).json({
            error: "Vardas turi būti nuo 1 iki 100 simbolių."
        });
    }

    if (
        typeof species !== "string" ||
        species.trim().length === 0 ||
        species.trim().length > 150
    ) {
        return res.status(422).json({
            error: "Rūšis turi būti nuo 1 iki 150 simbolių."
        });
    }

    if (notes !== null && typeof notes !== "string") {
        return res.status(422).json({
            error: "Pastabos turi būti tekstas arba null."
        });
    }

    if (arrival_date !== null) {
        const date = typeof arrival_date === "string"
            ? new Date(`${arrival_date}T00:00:00Z`)
            : new Date(NaN);

        if (
            typeof arrival_date !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(arrival_date) ||
            arrival_date.startsWith("0000") ||
            Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== arrival_date
        ) {
            return res.status(422).json({
                error: "Atvykimo data turi būti tikra data YYYY-MM-DD formatu arba null."
            });
        }
    }

    try {
        const result = await pool.query(
            `INSERT INTO pets (
                terrarium_id,
                name,
                species,
                arrival_date,
                notes
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                terrarium_id,
                name,
                species,
                to_char(arrival_date, 'YYYY-MM-DD') AS arrival_date,
                notes`,
            [
                terrarium_id,
                name.trim(),
                species.trim(),
                arrival_date,
                notes
            ]
        );

        const pet = result.rows[0];

        return res
            .location(`/pets/${pet.id}`)
            .status(201)
            .json(pet);
    } catch (error) {
        if (error.code === "23503") {
            return res.status(422).json({
                error: "Nurodytas terariumas neegzistuoja."
            });
        }

        console.error("Failed to create pet:", error.message);

        return res.status(500).json({
            error: "Nepavyko sukurti augintinio."
        });
    }
});

module.exports = router;
