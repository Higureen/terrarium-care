require("dotenv").config({
    path: require("node:path").join(__dirname, ".env")
});

const { Pool } = require("pg");

const pool = new Pool({
    connectionTimeoutMillis: 5000
});

module.exports = pool;