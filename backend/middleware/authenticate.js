const jwt = require("jsonwebtoken");
const pool = require("../db");

async function authenticate(req, res, next) {
  const authorization = req.get("Authorization");
  const match = authorization?.match(/^Bearer (\S+)$/i);

  if (!match) {
    return res.status(401).json({
      error: "Reikalingas prisijungimo žetonas."
    });
  }

  let payload;

  try {
    payload = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "terracare-api",
      audience: "terracare-client"
    });
  } catch {
    return res.status(401).json({
      error: "Žetonas netinkamas arba jo galiojimas pasibaigęs."
    });
  }

  const userId = Number(payload.sub);
  const validSessionId =
    typeof payload.sid === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      .test(payload.sid);

  if (
    !Number.isInteger(userId) ||
    userId <= 0 ||
    userId > 2147483647 ||
    !validSessionId ||
    !["worker", "manager", "admin"].includes(payload.role)
  ) {
    return res.status(401).json({
      error: "Netinkami žetono duomenys."
    });
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = $1
         AND s.user_id = $2
         AND s.revoked_at IS NULL
         AND s.expires_at > CURRENT_TIMESTAMP
         AND u.is_active = TRUE`,
      [payload.sid, userId]
    );

    const user = result.rows[0];

    if (!user || user.role !== payload.role) {
      return res.status(401).json({
        error: "Sesija nebegalioja arba pasikeitė naudotojo teisės."
      });
    }

    req.user = user;
    req.sessionId = payload.sid;

    return next();
  } catch (error) {
    console.error("Authentication failed:", error);

    return res.status(500).json({
      error: "Nepavyko patikrinti prisijungimo."
    });
  }
}

module.exports = authenticate;