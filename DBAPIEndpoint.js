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
  if (!categoryID || typeof categoryID !== "string") {
    return res.status(400).send("Invalid category ID provided.");
  }
  try {
    await sql.connect(config);
    const result =
      await sql.query`SELECT * FROM Menu WHERE category_id = ${categoryID}`;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/category", async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM Category`;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/customer", async (req, res) => {
  const { customer } = req.body;
  if (!customer || typeof customer !== "object") {
    return res.status(400).send("Invalid customer provided.");
  }
  try {
    await sql.connect(config);
    const customers =
      await sql.query`SELECT cust_id FROM Customer WHERE cust_email = ${customer.email}`;
    let sql_query;
    if (customers.recordset.length > 0) {
      sql_query =
        "UPDATE Customer SET cust_firstname = @cust_firstname, cust_lastname = @cust_lastname, phone = @phone, billing_address = @billing_address, billing_city = @billing_city, billing_state = @billing_state, billing_zip = @billing_zip, delivery_address = @delivery_address, delivery_city = @delivery_city, delivery_state = @delivery_state, delivery_zip = @delivery_zip WHERE cust_email = @cust_email";
    } else {
      sql_query =
        "INSERT INTO Customer (cust_firstname, cust_lastname, phone, cust_email, billing_address, billing_city, billing_state, billing_zip, delivery_address, delivery_city, delivery_state, delivery_zip) VALUES (@cust_firstname, @cust_lastname, @phone, @cust_email, @billing_address, @billing_city, @billing_state, @billing_zip, @delivery_address, @delivery_city, @delivery_state, @delivery_zip)";
    }

    const request = new sql.Request();
    request.input("cust_firstname", sql.VarChar, customer.firstname);
    request.input("cust_lastname", sql.VarChar, customer.lastname);
    request.input("phone", sql.VarChar, customer.phoneNumber);
    request.input("cust_email", sql.VarChar, customer.email);
    request.input("billing_address", sql.VarChar, customer.billing.address);
    request.input("billing_city", sql.VarChar, customer.billing.city);
    request.input("billing_state", sql.VarChar, customer.billing.state);
    request.input("billing_zip", sql.Int, parseInt(customer.billing.zipCode));
    request.input(
      "delivery_address",
      sql.VarChar,
      customer.delivery.address === "" ? null : customer.delivery.address
    );
    request.input(
      "delivery_city",
      sql.VarChar,
      customer.delivery.city === "" ? null : customer.delivery.city
    );
    request.input(
      "delivery_state",
      sql.VarChar,
      customer.delivery.state === "" ? null : customer.delivery.state
    );
    request.input(
      "delivery_zip",
      sql.Int,
      customer.delivery.zip === "" ? null : parseInt(customer.delivery.zipCode)
    );

    await request.query(sql_query);
    res.status(200).send("Customer added");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/updateRewards", async (req, res) => {
  const { customer } = req.body;
  if (!customer || typeof customer !== "object") {
    return res.status(400).send("Invalid rewards provided.");
  }
  try {
    await sql.connect(config);
    const request = new sql.Request();
    request.input("rewards", sql.Int, rewards);
    request.input("cust_email", sql.Int, customer.cust_email);
    await request.query(
      "UPDATE Customer SET rewards = @rewards WHERE cust_email = @cust_email"
    );
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/order", async (req, res) => {
  const { order_price, customer_email, delivery_status } = req.body;
  if (!order_price || typeof order_price !== "number") {
    return res.status(400).send("Invalid order price provided.");
  }
  if (!customer_email || typeof customer_email !== "string") {
    return res.status(400).send("Invalid customer email provided.");
  }
  if (isNaN(delivery_status) || typeof delivery_status !== "number") {
    return res.status(400).send("Invalid delivery status provided.");
  }

  try {
    await sql.connect(config);
    let result_id =
      await sql.query`SELECT cust_id FROM Customer WHERE cust_email = ${customer_email}`;
    if (result_id.recordset.length === 0) {
      return res.status(400).send("Invalid customer provided.");
    }

    let sql_query =
      "INSERT INTO Orders (cust_id, order_ts, total_price, order_status, delivery_status) OUTPUT INSERTED.order_id VALUES (@cust_id, @order_ts, @total_price, @order_status, @delivery_status)";

    const request = new sql.Request();
    let cust_id = result_id.recordset[0].cust_id;
    request.input("cust_id", sql.Int, cust_id);
    request.input("order_ts", sql.DateTime, new Date());
    request.input("total_price", sql.Decimal(18, 2), order_price);
    request.input("order_status", sql.Bit, 0);
    request.input("delivery_status", sql.Bit, delivery_status);

    const result = await request.query(sql_query);
    if (result.recordset && result.recordset.length > 0) {
      const orderId = result.recordset[0].order_id;
      return res.status(200).send({ order_id: orderId });
    } else {
      throw new Error("Insert operation did not return an order ID.");
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/orderDetails", async (req, res) => {
  const { order } = req.body;
  if (!order || typeof order !== "object") {
    return res.status(400).send("Invalid order provided.");
  }
  try {
    await sql.connect(config);
    let cust_id =
      await sql.query`SELECT cust_id FROM Customer WHERE cust_email = ${order.customer_email}`;
    if (cust_id.recordset.length === 0) {
      return res.status(400).send("Invalid customer provided.");
    }

    let sql_query =
      "INSERT INTO Order_Details (order_id, item_id, amount, total_price) VALUES ";
    const values = order.cart
      .map(
        (item) =>
          `(${order.order_id}, '${item.id}', ${item.quantity}, ${
            item.quantity * item.price
          })`
      )
      .join(", ");

    sql_query += values;
    await sql.query(sql_query);
    return res.status(200).send("Order details added");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/user", async (req, res) => {
  const { userEmail } = req.body;
  if (!userEmail || typeof userEmail !== "string") {
    return res.status(400).send("Invalid user provided.");
  }
  try {
    await sql.connect(config);
    const result =
      await sql.query`SELECT * FROM Customer WHERE cust_email = ${userEmail}`;
    let user = result.recordset[0];
    if (user) {
      return res.status(200).send(user);
    } else {
      return res.status(404).send("User not found.");
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
