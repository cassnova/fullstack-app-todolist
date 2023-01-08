const express = require("express");
const app = express();
const { pool } = require("./dbConfig");

// Middleware //
app.set("view engine", "ejs");

// Routes //
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/users/register", (req, res) => {
  res.render("register");
});

app.get("/users/login", (req, res) => {
  res.render("login");
});

app.get("/users/dashboard", (req, res) => {
  res.render("Bienvenido a tu Dashboard", { user: "Daniel Rojas" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server initialized on port ${PORT}`);
});
