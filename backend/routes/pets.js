const express = require("express");
const pool = require("../db");

const router = express.Router();

// Gauti visu augintiniu sarasa
router.get("/", async (req, res) => {
  const { page = "1", limit = "5", species } = req.query;

  //query parametrai turi but pavienes tekst reiksmes
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
    species !== undefined &&
    (
      typeof species !== "string" ||
      species.trim().length === 0 ||
      species.trim().length > 150 ||
      species.includes("\u0000")
    )
  ) {
    return res.status(400).json({
      error: "Rūšies filtras turi būti tekstas nuo 1 iki 150 simbolių."
    });
  }

  const speciesFilter = species === undefined ? null : species.trim();

  //rusi lyginame tiksliai, neatsizvelgiant i raidziu dydi
  const filterSql = speciesFilter === null
    ? ""
    : "WHERE LOWER(species) = LOWER($1)";

  const filterValues = speciesFilter === null ? [] : [speciesFilter];

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM pets ${filterSql}`,
      filterValues
    );

    const total = Number(countResult.rows[0].total);
    const totalPages = Math.ceil(total / pageSize);

    const limitPosition = filterValues.length + 1;
    const offsetPosition = filterValues.length + 2;

    const result = await pool.query(
      `SELECT id, terrarium_id, name, species,
              to_char(arrival_date, 'YYYY-MM-DD') AS arrival_date,
              notes
       FROM pets
       ${filterSql}
       ORDER BY id
       LIMIT $${limitPosition}
       OFFSET $${offsetPosition}`,
      [...filterValues, pageSize, offset]
    );

    const pageLink = (targetPage) => {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: String(pageSize)
      });

      if (speciesFilter !== null) {
        params.set("species", speciesFilter);
      }

      return `/pets?${params.toString()}`;
    };

    const data = result.rows.map(pet => ({
      ...pet,
      _links: {
        self: `/pets/${pet.id}`,
        profile: `/pets/${pet.id}/profile`,
        terrarium: `/terrariums/${pet.terrarium_id}`,
        care_records:
          `/terrariums/${pet.terrarium_id}/pets/${pet.id}/care-records`
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

//augintinio profilis, kur sujungiamas augintinis+terra+prieziuros irasas
router.get("/:id/profile", async (req, res) => {
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
      `SELECT
         p.id,
         p.terrarium_id,
         p.name,
         p.species,
         to_char(p.arrival_date, 'YYYY-MM-DD') AS arrival_date,
         p.notes,
         json_build_object(
           'id', t.id,
           'name', t.name,
           'temperature_min', t.temperature_min,
           'temperature_max', t.temperature_max,
           'humidity_min', t.humidity_min,
           'humidity_max', t.humidity_max,
           'last_cleaned', to_char(t.last_cleaned, 'YYYY-MM-DD'),
           'notes', t.notes
         ) AS terrarium
       FROM pets p
       JOIN terrariums t ON t.id = p.terrarium_id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Augintinis nerastas."
      });
    }

    const records = await pool.query(
      `SELECT id, pet_id, care_type, performed_at, notes
       FROM care_records
       WHERE pet_id = $1
       ORDER BY performed_at DESC, id DESC`,
      [id]
    );

    const { terrarium, ...pet } = result.rows[0];

    return res.status(200).json({
      pet,
      terrarium,
      care_records: records.rows
    });
  } catch (error) {
    console.error("Failed to fetch pet profile:", error.message);

    return res.status(500).json({
      error: "Nepavyko gauti augintinio profilio."
    });
  }
});
module.exports = router;
