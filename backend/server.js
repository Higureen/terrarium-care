const express = require("express");
const pool = require("./db");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

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

app.listen(port, "127.0.0.1", () => {
    console.log(`TerraCare API: http://localhost:${port}`);
});