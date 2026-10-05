const express = require("express");
const pool = require("../db");

const router = express.Router();

//prieziuros irasu sarasui pridedamas puslapiavimas ir filter pagal prieziuros tipa ir augintini
router.get("/", async (req, res) => {
  const { page = "1", limit = "5", care_type, pet_id } = req.query;

  if (
    typeof page !== "string" ||
    typeof limit !== "string" ||
    !/^[1-9]\d*$/.test(page) ||
    !/^[1-9]\d*$/.test(limit)
  ) {
    return res.status(400).json({
      error: "page ir limit turi būti teigiami sveikieji skaičiai."
    });
  }

  const pageNumber = Number(page);
  const pageSize = Number(limit);
  const offset = (pageNumber - 1) * pageSize;

  if (
    !Number.isSafeInteger(pageNumber) ||
    !Number.isSafeInteger(pageSize) ||
    pageSize > 100 ||
    !Number.isSafeInteger(offset)
  ) {
    return res.status(400).json({
      error: "Netinkamas puslapis arba limit. limit negali viršyti 100."
    });
  }

  if (
    care_type !== undefined &&
    !["feeding", "observation", "other"].includes(care_type)
  ) {
    return res.status(400).json({
      error: "Priežiūros tipas turi būti feeding, observation arba other."
    });
  }

  let petId = null;

  if (pet_id !== undefined) {
    if (
      typeof pet_id !== "string" ||
      !/^[1-9]\d*$/.test(pet_id) ||
      !Number.isSafeInteger(Number(pet_id)) ||
      Number(pet_id) > 2147483647
    ) {
      return res.status(400).json({
        error: "Netinkamas augintinio ID filtras."
      });
    }

    petId = Number(pet_id);
  }

  const conditions = [];
  const values = [];

  if (care_type !== undefined) {
    values.push(care_type);
    conditions.push(`care_type = $${values.length}`);
  }

  if (petId !== null) {
    values.push(petId);
    conditions.push(`pet_id = $${values.length}`);
  }

  const filterSql = conditions.length > 0
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM care_records ${filterSql}`,
      values
    );

    const total = Number(countResult.rows[0].total);
    const totalPages = Math.ceil(total / pageSize);

    const limitPosition = values.length + 1;
    const offsetPosition = values.length + 2;

    const result = await pool.query(
      `SELECT id, pet_id, care_type, performed_at, notes
       FROM care_records
       ${filterSql}
       ORDER BY performed_at DESC, id DESC
       LIMIT $${limitPosition}
       OFFSET $${offsetPosition}`,
      [...values, pageSize, offset]
    );

    const pageLink = (targetPage) => {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: String(pageSize)
      });

      if (care_type !== undefined) {
        params.set("care_type", care_type);
      }

      if (petId !== null) {
        params.set("pet_id", String(petId));
      }

      return `/care-records?${params.toString()}`;
    };

    const data = result.rows.map(record => ({
      ...record,
      _links: {
        self: `/care-records/${record.id}`,
        pet: `/pets/${record.pet_id}`,
        profile: `/pets/${record.pet_id}/profile`
      }
    }));

    return res.status(200).json({
      data,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages
      },
      _links: {
        self: pageLink(pageNumber),
        first: pageLink(1),
        previous: pageNumber > 1 ? pageLink(pageNumber - 1) : null,
        next: pageNumber < totalPages ? pageLink(pageNumber + 1) : null
      }
    });
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