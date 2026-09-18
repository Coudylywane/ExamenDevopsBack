require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "ok", db_time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products", async (req, res) => {
  const { name, price, quantity } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const priceNum = price === undefined ? 0 : Number(price);
  const quantityNum = quantity === undefined ? 0 : Number(quantity);
  if (isNaN(priceNum) || isNaN(quantityNum)) {
    return res.status(400).json({ error: "price and quantity must be numbers" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO products (name, price, quantity) VALUES ($1, $2, $3) RETURNING *",
      [name, priceNum, quantityNum]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, quantity } = req.body;
  const priceNum = price === undefined ? null : Number(price);
  const quantityNum = quantity === undefined ? null : Number(quantity);
  if ((priceNum !== null && isNaN(priceNum)) || (quantityNum !== null && isNaN(quantityNum))) {
    return res.status(400).json({ error: "price and quantity must be numbers" });
  }
  try {
    const result = await pool.query(
      "UPDATE products SET name = COALESCE($1, name), price = COALESCE($2, price), quantity = COALESCE($3, quantity) WHERE id = $4 RETURNING *",
      [name ?? null, priceNum, quantityNum, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "product not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "product not found" });
    res.json({ message: "deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
