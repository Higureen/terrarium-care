require("dotenv").config({
  path: require("node:path").join(__dirname, ".env")
});

const { Pool } = require("pg");

const config = {
  connectionTimeoutMillis: 10000
};

if (process.env.DATABASE_URL) {
  config.connectionString = process.env.DATABASE_URL;
}

const pool = new Pool(config);

pool.on("error", (error) => {
  console.error("Netikėta DB ryšio klaida:", error.message);
});

module.exports = pool;