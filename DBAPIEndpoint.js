const express = require("express");
const cors = require("cors");
const sql = require("mssql");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.REACT_APP_PORT || 5000;

const config = {
  user: process.env.REACT_APP_USER,
  password: process.env.REACT_APP_PASSWORD,
  server: process.env.REACT_APP_SERVER,
  database: process.env.REACT_APP_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

app.post("/menu", async (req, res) => {
  const { categoryID } = req.body;
  console.log("PRE-ID:", categoryID);
  if (!categoryID || typeof categoryID !== "string") {
    return res.status(400).send("Invalid category ID provided.");
  }
  try {
    console.log(
      `MENU: Attempting to connect to the database at server: ${config.server} on database: ${config.database}`
    );
    await sql.connect(config);
    console.log("Successfully connected to the database.");
    console.log("Executing query to fetch menu items...");
    console.log("ID:", categoryID);
    const result =
      await sql.query`SELECT * FROM Menu WHERE category_id = ${categoryID}`;
    console.log(
      "Query executed successfully. Number of items fetched:",
      result.recordset.length
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/category", async (req, res) => {
  try {
    console.log(
      `CAT: Attempting to connect to the database at server: ${config.server} on database: ${config.database}`
    );
    await sql.connect(config);
    // console.log("Successfully connected to the database.");
    // console.log("Executing query to fetch category items...");
    const result = await sql.query`SELECT * FROM Category`;
    console.log(
      "Query executed successfully. Number of items fetched:",
      result.recordset.length
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
