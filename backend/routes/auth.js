const express = require("express");
const argon2 = require("argon2");
const pool = require("../db");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const authenticate = require("../middleware/authenticate");
const router = express.Router();

router.post("/register", async (req, res) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(422).json({
      error: "Pateikite registracijos duomenis JSON objektu."
    });
  }

  const { name, email, password } = body;

  if (
    typeof name !== "string" ||
    name.trim().length === 0 ||
    name.trim().length > 100 ||
    name.includes("\u0000")
  ) {
    return res.status(422).json({
      error: "Vardas privalomas ir negali viršyti 100 simbolių."
    });
  }

  if (
    typeof email !== "string" ||
    email.trim().length > 254 ||
    email.includes("\u0000") ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return res.status(422).json({
      error: "Pateikite tinkamą el. pašto adresą."
    });
  }

  if (
    typeof password !== "string" ||
    password.length < 15 ||
    password.length > 128 ||
    password.trim().length === 0 ||
    password.includes("\u0000")
  ) {
    return res.status(422).json({
      error: "Slaptažodis turi būti nuo 15 iki 128 simbolių."
    });
  }

  if (Object.hasOwn(body, "role")) {
    return res.status(422).json({
      error: "Registruojantis rolės pasirinkti negalima."
    });
  }

  try {
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id
    });

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'worker')
       RETURNING id, name, email, role, created_at`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        passwordHash
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Šis el. pašto adresas jau naudojamas."
      });
    }

    console.error("Registration failed:", error);

    return res.status(500).json({
      error: "Nepavyko sukurti paskyros."
    });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    email.trim().length === 0 ||
    email.trim().length > 254 ||
    email.includes("\u0000") ||
    typeof password !== "string" ||
    password.length === 0 ||
    password.length > 128
  ) {
    return res.status(422).json({
      error: "Pateikite el. paštą ir slaptažodį."
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, password_hash, role, is_active
       FROM users
       WHERE LOWER(email) = $1`,
      [email.trim().toLowerCase()]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        error: "Neteisingas el. paštas arba slaptažodis."
      });
    }

    const passwordMatches = await argon2.verify(
      user.password_hash,
      password
    );

    if (!passwordMatches || !user.is_active) {
      return res.status(401).json({
        error: "Neteisingi prisijungimo duomenys arba paskyra neaktyvi."
      });
    }

    // konfig patikrinimas
    const secret = process.env.JWT_SECRET;
    const refreshDays = Number(process.env.REFRESH_TOKEN_DAYS ?? 7);

    if (
      !secret ||
      secret.length < 64 ||
      !Number.isInteger(refreshDays) ||
      refreshDays < 1 ||
      refreshDays > 30
    ) {
      throw new Error("Netinkama JWT arba refresh žetono konfigūracija.");
    }

    const sessionId = crypto.randomUUID();

    //atsitiktinis refresh zetonas. DB saugoma tik jo maisa
    const refreshToken = crypto.randomBytes(32).toString("hex");

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const refreshExpiresAt = new Date(
      Date.now() + refreshDays * 24 * 60 * 60 * 1000
    );

    const accessToken = jwt.sign(
      {
        role: user.role,
        sid: sessionId
      },
      secret,
      {
        algorithm: "HS256",
        subject: String(user.id),
        expiresIn: process.env.JWT_ACCESS_TTL ?? "15m",
        issuer: "terracare-api",
        audience: "terracare-client"
      }
    );

    await pool.query(
      `INSERT INTO auth_sessions
         (id, user_id, refresh_token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, user.id, refreshTokenHash, refreshExpiresAt]
    );

    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login failed:", error);

    return res.status(500).json({
      error: "Nepavyko prisijungti."
    });
  }
});

router.get("/me", authenticate, (req, res) => {
  res.set("Cache-Control", "no-store");

  return res.status(200).json(req.user);
});

router.post("/refresh", async (req, res) => {
  res.set("Cache-Control", "no-store");

  const { refreshToken } = req.body ?? {};

  if (
    typeof refreshToken !== "string" ||
    !/^[a-f0-9]{64}$/.test(refreshToken)
  ) {
    return res.status(422).json({
      error: "Pateikite tinkamo formato refreshToken."
    });
  }

  try {
    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const result = await pool.query(
      `SELECT s.id AS session_id, u.id, u.name, u.email, u.role
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.refresh_token_hash = $1
         AND s.revoked_at IS NULL
         AND s.expires_at > CURRENT_TIMESTAMP
         AND u.is_active = TRUE`,
      [tokenHash]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        error: "Atnaujinimo žetonas netinkamas arba nebegalioja."
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 64) {
      throw new Error("Netinkama JWT konfigūracija.");
    }

    const newRefreshToken = crypto.randomBytes(32).toString("hex");

    const newRefreshTokenHash = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");

    const accessToken = jwt.sign(
      {
        role: user.role,
        sid: user.session_id
      },
      secret,
      {
        algorithm: "HS256",
        subject: String(user.id),
        expiresIn: process.env.JWT_ACCESS_TTL ?? "15m",
        issuer: "terracare-api",
        audience: "terracare-client"
      }
    );

    // pakeiciame tik vis dar galiojanti, dar nepanaudota zetona
    const updated = await pool.query(
      `UPDATE auth_sessions
       SET refresh_token_hash = $1
       WHERE id = $2
         AND refresh_token_hash = $3
         AND revoked_at IS NULL
         AND expires_at > CURRENT_TIMESTAMP
       RETURNING id`,
      [newRefreshTokenHash, user.session_id, tokenHash]
    );

    if (updated.rowCount === 0) {
      return res.status(401).json({
        error: "Atnaujinimo žetonas jau panaudotas arba nebegalioja."
      });
    }

    return res.status(200).json({
      accessToken,
      refreshToken: newRefreshToken,
      tokenType: "Bearer",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Token refresh failed:", error);

    return res.status(500).json({
      error: "Nepavyko atnaujinti žetonų."
    });
  }
});

router.post("/logout", authenticate, async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    await pool.query(
      `UPDATE auth_sessions
       SET revoked_at = CURRENT_TIMESTAMP
       WHERE id = $1
         AND user_id = $2
         AND revoked_at IS NULL`,
      [req.sessionId, req.user.id]
    );

    return res.status(204).send();
  } catch (error) {
    console.error("Logout failed:", error);

    return res.status(500).json({
      error: "Nepavyko atsijungti."
    });
  }
});

module.exports = router;