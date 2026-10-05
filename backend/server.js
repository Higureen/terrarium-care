const swaggerUi = require("swagger-ui-express");
const openapi = require("./openapi.json");
const express = require("express");
const pool = require("./db");
const petRoutes = require("./routes/pets");
const careRecordRoutes = require("./routes/careRecords");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapi));

app.get("/openapi.json", (req, res) => {
  res.json(openapi);
});

app.use("/pets", petRoutes);
app.use("/care-records", careRecordRoutes);

app.put("/terrariums/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (
        !/^[1-9]\d*$/.test(req.params.id) ||
        !Number.isSafeInteger(id) ||
        id > 2147483647
    ) {
        return res.status(400).json({
            error: "Netinkamas terariumo ID."
        });
    }

    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return res.status(422).json({
            error: "Reikia pateikti JSON objektą."
        });
    }

    const {
        name,
        temperature_min,
        temperature_max,
        humidity_min,
        humidity_max,
        last_cleaned = null,
        notes = null
    } = body;

    if (
        typeof name !== "string" ||
        name.trim().length === 0 ||
        name.trim().length > 100
    ) {
        return res.status(422).json({
            error: "Pavadinimas turi būti nuo 1 iki 100 simbolių."
        });
    }

    const numbers = [
        temperature_min,
        temperature_max,
        humidity_min,
        humidity_max
    ];

    if (!numbers.every(value =>
        typeof value === "number" && Number.isFinite(value)
    )) {
        return res.status(422).json({
            error: "Temperatūros ir drėgmės ribos turi būti skaičiai."
        });
    }

    if (
        Math.abs(temperature_min) > 999.99 ||
        Math.abs(temperature_max) > 999.99 ||
        temperature_min > temperature_max
    ) {
        return res.status(422).json({
            error: "Netinkamos temperatūros ribos."
        });
    }

    if (
        humidity_min < 0 ||
        humidity_max > 100 ||
        humidity_min > humidity_max
    ) {
        return res.status(422).json({
            error: "Netinkamos drėgmės ribos."
        });
    }

    if (notes !== null && typeof notes !== "string") {
        return res.status(422).json({
            error: "Pastabos turi būti tekstas arba null."
        });
    }

    if (last_cleaned !== null) {
        const date = typeof last_cleaned === "string"
            ? new Date(`${last_cleaned}T00:00:00Z`)
            : new Date(NaN);

        if (
            typeof last_cleaned !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(last_cleaned) ||
            last_cleaned.startsWith("0000") ||
            Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== last_cleaned
        ) {
            return res.status(422).json({
                error: "Valymo data turi būti tikra data YYYY-MM-DD formatu arba null."
            });
        }
    }

    try {
        const result = await pool.query(
            `UPDATE terrariums
             SET name = $1,
                 temperature_min = $2,
                 temperature_max = $3,
                 humidity_min = $4,
                 humidity_max = $5,
                 last_cleaned = $6,
                 notes = $7
             WHERE id = $8
             RETURNING
                 id,
                 name,
                 temperature_min,
                 temperature_max,
                 humidity_min,
                 humidity_max,
                 to_char(last_cleaned, 'YYYY-MM-DD') AS last_cleaned,
                 notes`,
            [
                name.trim(),
                temperature_min,
                temperature_max,
                humidity_min,
                humidity_max,
                last_cleaned,
                notes,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Terariumas nerastas."
            });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Failed to update terrarium:", error.message);

        return res.status(500).json({
            error: "Nepavyko atnaujinti terariumo."
        });
    }
});

app.delete("/terrariums/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (
        !/^[1-9]\d*$/.test(req.params.id) ||
        !Number.isSafeInteger(id) ||
        id > 2147483647
    ) {
        return res.status(400).json({
            error: "Netinkamas terariumo ID."
        });
    }

    try {
        const result = await pool.query(
            "DELETE FROM terrariums WHERE id = $1 RETURNING id",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Terariumas nerastas."
            });
        }

        return res.status(204).send();
    } catch (error) {
        if (error.code === "23503") {
            return res.status(409).json({
                error: "Terariumo ištrinti negalima, nes jame yra augintinių."
            });
        }

        console.error("Failed to delete terrarium:", error.message);

        return res.status(500).json({
            error: "Nepavyko ištrinti terariumo."
        });
    }
});



app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.status(200).json({
            status: "ok",
            database: "connected"
        });
    } catch (error) {
        console.error("Database connection error:", error.message);

        res.status(503).json({
            status: "error",
            database: "unavailable"
        });
    }
});
//pridedamas filter pagal pavad ir puslapiavimas
app.get("/terrariums", async (req, res) => {
  const { page = "1", limit = "5", name } = req.query;

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
    name !== undefined &&
    (
      typeof name !== "string" ||
      name.trim().length === 0 ||
      name.trim().length > 100 ||
      name.includes("\u0000")
    )
  ) {
    return res.status(400).json({
      error: "Pavadinimo filtras turi būti tekstas nuo 1 iki 100 simbolių."
    });
  }

  const nameFilter = name === undefined ? null : name.trim();

  //ieskom pavadinimo dalies neatsizvelgiant i raidziu dydi
  const filterSql = nameFilter === null
    ? ""
    : "WHERE strpos(LOWER(name), LOWER($1)) > 0";

  const filterValues = nameFilter === null ? [] : [nameFilter];

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM terrariums ${filterSql}`,
      filterValues
    );

    const total = Number(countResult.rows[0].total);
    const totalPages = Math.ceil(total / pageSize);

    const limitPosition = filterValues.length + 1;
    const offsetPosition = filterValues.length + 2;

    const result = await pool.query(
      `SELECT id, name,
              temperature_min, temperature_max,
              humidity_min, humidity_max,
              to_char(last_cleaned, 'YYYY-MM-DD') AS last_cleaned,
              notes
       FROM terrariums
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

      if (nameFilter !== null) {
        params.set("name", nameFilter);
      }

      return `/terrariums?${params.toString()}`;
    };

    const data = result.rows.map(terrarium => ({
      ...terrarium,
      _links: {
        self: `/terrariums/${terrarium.id}`,
        pets: `/terrariums/${terrarium.id}/pets`
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
    console.error("Failed to fetch terrariums:", error.message);

    return res.status(500).json({
      error: "Nepavyko gauti terariumų sąrašo."
    });
  }
});

app.get("/terrariums/:id", async (req, res) => {
    const rawId = req.params.id;
    const id = Number(rawId);

    if (
        !/^[1-9]\d*$/.test(rawId) ||
        !Number.isSafeInteger(id) ||
        id > 2147483647
    ) {
        return res.status(400).json({
            error: "ID turi būti teigiamas sveikasis skaičius iki 2147483647."
        });
    }

    try {
        const result = await pool.query(
            `SELECT
                id,
                name,
                temperature_min,
                temperature_max,
                humidity_min,
                humidity_max,
                to_char(last_cleaned, 'YYYY-MM-DD') AS last_cleaned,
                notes
             FROM terrariums
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Terariumas nerastas."
            });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Failed to fetch terrarium:", error.message);

        return res.status(500).json({
            error: "Nepavyko gauti terariumo."
        });
    }
});

app.post("/terrariums", async (req, res) => {
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return res.status(422).json({
            error: "Reikia pateikti JSON objektą su terariumo duomenimis."
        });
    }

    const {
        name,
        temperature_min,
        temperature_max,
        humidity_min,
        humidity_max,
        last_cleaned = null,
        notes = null
    } = body;

    if (
        typeof name !== "string" ||
        name.trim().length === 0 ||
        name.trim().length > 100
    ) {
        return res.status(422).json({
            error: "Pavadinimas turi būti nuo 1 iki 100 simbolių."
        });
    }

    const numbers = [
        temperature_min,
        temperature_max,
        humidity_min,
        humidity_max
    ];

    if (!numbers.every(value =>
        typeof value === "number" && Number.isFinite(value)
    )) {
        return res.status(422).json({
            error: "Temperatūros ir drėgmės ribos turi būti skaičiai."
        });
    }

    if (
        Math.abs(temperature_min) > 999.99 ||
        Math.abs(temperature_max) > 999.99 ||
        temperature_min > temperature_max
    ) {
        return res.status(422).json({
            error: "Netinkamos temperatūros ribos."
        });
    }

    if (
        humidity_min < 0 ||
        humidity_max > 100 ||
        humidity_min > humidity_max
    ) {
        return res.status(422).json({
            error: "Drėgmė turi būti nuo 0 iki 100, o minimumas negali viršyti maksimumo."
        });
    }

    if (notes !== null && typeof notes !== "string") {
        return res.status(422).json({
            error: "Pastabos turi būti tekstas arba null."
        });
    }

    if (last_cleaned !== null) {
        const date = typeof last_cleaned === "string"
            ? new Date(`${last_cleaned}T00:00:00Z`)
            : new Date(NaN);

        if (
            typeof last_cleaned !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(last_cleaned) ||
            last_cleaned.startsWith("0000") ||
            Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== last_cleaned
        ) {
            return res.status(422).json({
                error: "Valymo data turi būti tikra data YYYY-MM-DD formatu arba null."
            });
        }
    }

    try {
        const result = await pool.query(
            `INSERT INTO terrariums (
                name,
                temperature_min,
                temperature_max,
                humidity_min,
                humidity_max,
                last_cleaned,
                notes
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING
                id,
                name,
                temperature_min,
                temperature_max,
                humidity_min,
                humidity_max,
                to_char(last_cleaned, 'YYYY-MM-DD') AS last_cleaned,
                notes`,
            [
                name.trim(),
                temperature_min,
                temperature_max,
                humidity_min,
                humidity_max,
                last_cleaned,
                notes
            ]
        );

        const terrarium = result.rows[0];

        return res
            .location(`/terrariums/${terrarium.id}`)
            .status(201)
            .json(terrarium);
    } catch (error) {
        console.error("Failed to create terrarium:", error.message);

        return res.status(500).json({
            error: "Nepavyko sukurti terariumo."
        });
    }
});

app.use((error, req, res, next) => {
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({
            error: "Netaisyklingas JSON formatas."
        });
    }

    next(error);
});
//hierarchinis get metodas
app.get("/terrariums/:id/pets", async (req, res) => {
  const id = Number(req.params.id);

  if (
    !/^[1-9]\d*$/.test(req.params.id) ||
    !Number.isSafeInteger(id) ||
    id > 2147483647
  ) {
    return res.status(400).json({
      error: "Netinkamas terariumo ID."
    });
  }

  try {
    const terrarium = await pool.query(
      "SELECT id FROM terrariums WHERE id = $1",
      [id]
    );

    if (terrarium.rows.length === 0) {
      return res.status(404).json({
        error: "Terariumas nerastas."
      });
    }

    const result = await pool.query(
      `SELECT id, terrarium_id, name, species,
              to_char(arrival_date, 'YYYY-MM-DD') AS arrival_date,
              notes
       FROM pets
       WHERE terrarium_id = $1
       ORDER BY id`,
      [id]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Failed to fetch terrarium pets:", error.message);

    return res.status(500).json({
      error: "Nepavyko gauti terariumo augintinių."
    });
  }
});

app.get(
  "/terrariums/:terrariumId/pets/:petId/care-records",
  async (req, res) => {
    const { terrariumId: rawTerrariumId, petId: rawPetId } = req.params;

    const terrariumId = Number(rawTerrariumId);
    const petId = Number(rawPetId);

    const isValidId = (raw, value) =>
      /^[1-9]\d*$/.test(raw) &&
      Number.isSafeInteger(value) &&
      value <= 2147483647;

    if (
      !isValidId(rawTerrariumId, terrariumId) ||
      !isValidId(rawPetId, petId)
    ) {
      return res.status(400).json({
        error: "Terariumo ir augintinio ID turi būti teigiami sveikieji skaičiai."
      });
    }

    try {
      const terrarium = await pool.query(
        "SELECT id FROM terrariums WHERE id = $1",
        [terrariumId]
      );

      if (terrarium.rows.length === 0) {
        return res.status(404).json({
          error: "Terariumas nerastas."
        });
      }

      //tikrinam ar augintinis priklauso butent tam terariumui
      const pet = await pool.query(
        `SELECT id
         FROM pets
         WHERE id = $1 AND terrarium_id = $2`,
        [petId, terrariumId]
      );

      if (pet.rows.length === 0) {
        return res.status(404).json({
          error: "Augintinis šiame terariume nerastas."
        });
      }

      const records = await pool.query(
        `SELECT id, pet_id, care_type, performed_at, notes
         FROM care_records
         WHERE pet_id = $1
         ORDER BY performed_at DESC, id DESC`,
        [petId]
      );

      return res.status(200).json(records.rows);
    } catch (error) {
      console.error(
        "Failed to fetch scoped care records:",
        error.message
      );

      return res.status(500).json({
        error: "Nepavyko gauti augintinio priežiūros įrašų."
      });
    }
  }
);
app.listen(port, "127.0.0.1", () => {
    console.log(`TerraCare API: http://localhost:${port}`);
});