const express = require("express");
const pool = require("../db");

const router = express.Router();

// Gauti visu augintiniu sarasa
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

// Sukurti augintini
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
 // augintinio gavimas pagal id
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (
    !/^[1-9]\d*$/.test(req.params.id) ||
    !Number.isSafeInteger(id) ||
    id > 2147483647
  ) {
    return res.status(400).json({
      error: "Augintinio ID turi būti teigiamas sveikasis skaičius."
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, terrarium_id, name, species,
              to_char(arrival_date, 'YYYY-MM-DD') AS arrival_date,
              notes
       FROM pets
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Augintinis nerastas."
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to fetch pet:", error.message);

    return res.status(500).json({
      error: "Nepavyko gauti augintinio."
    });
  }
});

//augintinio redagavimas
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (
    !/^[1-9]\d*$/.test(req.params.id) ||
    !Number.isSafeInteger(id) ||
    id > 2147483647
  ) {
    return res.status(400).json({
      error: "Netinkamas augintinio ID."
    });
  }

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
      error: "Netinkamas terariumo ID."
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
    if (
      typeof arrival_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(arrival_date) ||
      arrival_date.startsWith("0000")
    ) {
      return res.status(422).json({
        error: "Data turi būti YYYY-MM-DD formato."
      });
    }

    const date = new Date(`${arrival_date}T00:00:00Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== arrival_date
    ) {
      return res.status(422).json({
        error: "Nurodyta data neegzistuoja."
      });
    }
  }

  try {
    const result = await pool.query(
      `UPDATE pets
       SET terrarium_id = $1,
           name = $2,
           species = $3,
           arrival_date = $4,
           notes = $5
       WHERE id = $6
       RETURNING id, terrarium_id, name, species,
                 to_char(arrival_date, 'YYYY-MM-DD') AS arrival_date,
                 notes`,
      [
        terrarium_id,
        name.trim(),
        species.trim(),
        arrival_date,
        notes,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Augintinis nerastas."
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23503") {
      return res.status(422).json({
        error: "Nurodytas terariumas neegzistuoja."
      });
    }

    console.error("Failed to update pet:", error.message);

    return res.status(500).json({
      error: "Nepavyko atnaujinti augintinio."
    });
  }
});

//augintinio istrynimas
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (
    !/^[1-9]\d*$/.test(req.params.id) ||
    !Number.isSafeInteger(id) ||
    id > 2147483647
  ) {
    return res.status(400).json({
      error: "Netinkamas augintinio ID."
    });
  }

  try {
    const result = await pool.query(
      "DELETE FROM pets WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Augintinis nerastas."
      });
    }

    return res.status(204).send();
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        error: "Augintinio ištrinti negalima, nes jis turi priežiūros įrašų."
      });
    }

    console.error("Failed to delete pet:", error.message);

    return res.status(500).json({
      error: "Nepavyko ištrinti augintinio."
    });
  }
});

module.exports = router;
