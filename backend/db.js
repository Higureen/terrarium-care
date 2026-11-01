require("dotenv").config({
    path: require("node:path").join(__dirname, ".env"),
    override: true
});
console.log({
  envFileExists: require("node:fs").existsSync(
    require("node:path").join(__dirname, ".env")
  ),
  passwordType: typeof process.env.PGPASSWORD,
  passwordPresent: Boolean(process.env.PGPASSWORD)
});
const { Pool } = require("pg");

const pool = new Pool({
    connectionTimeoutMillis: 5000
});

module.exports = pool;