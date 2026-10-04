const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, pet_id, care_type, performed_at, notes
       FROM care_records
       ORDER BY performed_at DESC, id DESC`
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Failed to fetch care records:", error.message);

    return res.status(500).json({
      error: "Nepavyko gauti priežiūros įrašų."
    });
  }
});

//prieziuros iraso kurimas
router.post("/", async (req, res) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(422).json({
      error: "Reikia pateikti JSON objektą."
    });
  }

  const { pet_id, care_type, notes } = body;

  if (
    !Number.isInteger(pet_id) ||
    pet_id < 1 ||
    pet_id > 2147483647
  ) {
    return res.status(422).json({
      error: "Netinkamas augintinio ID."
    });
  }

  const allowedTypes = ["feeding", "observation", "other"];

  if (!allowedTypes.includes(care_type)) {
    return res.status(422).json({
      error: "Priežiūros tipas turi būti feeding, observation arba other."
    });
  }

  if (typeof notes !== "string" || notes.trim().length === 0) {
    return res.status(422).json({
      error: "Priežiūros pastabos negali būti tuščios."
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO care_records (pet_id, care_type, notes)
       VALUES ($1, $2, $3)
       RETURNING id, pet_id, care_type, performed_at, notes`,
      [pet_id, care_type, notes.trim()]
    );

    const record = result.rows[0];

    return res
      .location(`/care-records/${record.id}`)
      .status(201)
      .json(record);
  } catch (error) {
    if (error.code === "23503") {
      return res.status(422).json({
        error: "Nurodytas augintinis neegzistuoja."
      });
    }

    console.error("Failed to create care record:", error.message);

    return res.status(500).json({
      error: "Nepavyko sukurti priežiūros įrašo."
    });
  }
});

//prieziuros iraso gavimas
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (
    !/^[1-9]\d*$/.test(req.params.id) ||
    !Number.isSafeInteger(id) ||
    id > 2147483647
  ) {
    return res.status(400).json({
      error: "Netinkamas priežiūros įrašo ID."
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, pet_id, care_type, performed_at, notes
       FROM care_records
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Priežiūros įrašas nerastas."
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to fetch care record:", error.message);

    return res.status(500).json({
      error: "Nepavyko gauti priežiūros įrašo."
    });
  }
});

//prieziuros iraso redagavimas
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (
    !/^[1-9]\d*$/.test(req.params.id) ||
    !Number.isSafeInteger(id) ||
    id > 2147483647
  ) {
    return res.status(400).json({
      error: "Netinkamas priežiūros įrašo ID."
    });
  }

  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(422).json({
      error: "Reikia pateikti JSON objektą."
    });
  }

  const { pet_id, care_type, notes } = body;

  if (
    !Number.isInteger(pet_id) ||
    pet_id < 1 ||
    pet_id > 2147483647
  ) {
    return res.status(422).json({
      error: "Netinkamas augintinio ID."
    });
  }

  const allowedTypes = ["feeding", "observation", "other"];

  if (!allowedTypes.includes(care_type)) {
    return res.status(422).json({
      error: "Priežiūros tipas turi būti feeding, observation arba other."
    });
  }

  if (typeof notes !== "string" || notes.trim().length === 0) {
    return res.status(422).json({
      error: "Priežiūros pastabos negali būti tuščios."
    });
  }

  try {
    const result = await pool.query(
      `UPDATE care_records
       SET pet_id = $1,
           care_type = $2,
           notes = $3
       WHERE id = $4
       RETURNING id, pet_id, care_type, performed_at, notes`,
      [pet_id, care_type, notes.trim(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Priežiūros įrašas nerastas."
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23503") {
      return res.status(422).json({
        error: "Nurodytas augintinis neegzistuoja."
      });
    }

    console.error("Failed to update care record:", error.message);

    return res.status(500).json({
      error: "Nepavyko atnaujinti priežiūros įrašo."
    });
  }
});

//prieziuros iraso trynimas
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (
    !/^[1-9]\d*$/.test(req.params.id) ||
    !Number.isSafeInteger(id) ||
    id > 2147483647
  ) {
    return res.status(400).json({
      error: "Netinkamas priežiūros įrašo ID."
    });
  }

  try {
    const result = await pool.query(
      "DELETE FROM care_records WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Priežiūros įrašas nerastas."
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Failed to delete care record:", error.message);

    return res.status(500).json({
      error: "Nepavyko ištrinti priežiūros įrašo."
    });
  }
});

module.exports = router;