const express = require("express");
const pool = require("../db");
const authorize = require("../middleware/authorize");

const router = express.Router();

// visi sio failo endpointai prieinami tik administratoriui
router.use(authorize("admin"));

router.get("/", async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    const result = await pool.query(
      `SELECT id, name, email, role, is_active, created_at
       FROM users
       ORDER BY id`
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Failed to fetch users:", error.message);

    return res.status(500).json({
      error: "Nepavyko gauti naudotojų sąrašo."
    });
  }
});

router.patch("/:id", async (req, res) => {
  res.set("Cache-Control", "no-store");

  const id = Number(req.params.id);

  if (
    !/^[1-9]\d*$/.test(req.params.id) ||
    !Number.isSafeInteger(id) ||
    id > 2147483647
  ) {
    return res.status(400).json({
      error: "Netinkamas naudotojo ID."
    });
  }

  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(422).json({
      error: "Pateikite JSON objektą."
    });
  }

  const keys = Object.keys(body);

  if (
    keys.length === 0 ||
    keys.some(key => !["role", "is_active"].includes(key))
  ) {
    return res.status(422).json({
      error: "Galima pateikti tik role ir is_active laukus."
    });
  }

  if (
    Object.hasOwn(body, "role") &&
    !["worker", "manager", "admin"].includes(body.role)
  ) {
    return res.status(422).json({
      error: "Rolė turi būti worker, manager arba admin."
    });
  }

  if (
    Object.hasOwn(body, "is_active") &&
    typeof body.is_active !== "boolean"
  ) {
    return res.status(422).json({
      error: "is_active turi būti true arba false."
    });
  }

  // neleidziame administratoriui uzblokuoti savo prieigos
  if (id === req.user.id) {
    return res.status(403).json({
      error: "Savo paskyros teisių ir aktyvumo čia keisti negalima."
    });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE users
       SET role = COALESCE($1::varchar, role),
           is_active = COALESCE($2::boolean, is_active)
       WHERE id = $3
       RETURNING id, name, email, role, is_active`,
      [body.role ?? null, body.is_active ?? null, id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Naudotojas nerastas."
      });
    }

    await client.query(
      `UPDATE auth_sessions
       SET revoked_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [id]
    );

    await client.query("COMMIT");

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error("Failed to update user:", error.message);

    return res.status(500).json({
      error: "Nepavyko atnaujinti naudotojo."
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;