const express = require("express");
const app = express();
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");

// MIDDLEWARE //
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);

//           //

// ROUTES //
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

//             //

// POST METHOD //
app.post("/users/register", async (req, res) => {
  let { name, email, password, password2 } = req.body;

  console.log({
    name,
    email,
    password,
    password2,
  });

  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg: "Por favor ingresa todos los datos" });
  }
  if (password.length < 6) {
    errors.push({ msg: "La contraseña debe tener mas de 6 caracteres" });
  }
  if (password !== password2) {
    errors.push({ msg: "Las contraseñas no son iguales" });
  }
  if (errors.length > 0) {
    res.render("register", { errors });
  } else {
    // Password encrypt
    let passEncrypt = await bcrypt.hash(password, 10);
    console.log(passEncrypt);

    pool.query(
      `SELECT * FROM users 
    WHERE email=$1`,
      [email],
      (err, result) => {
        if (err) {
          throw err;
        }
        console.log(result.rows);

        if (result.rows.length > 0) {
          errors.push({ msg: "El usuario ya existe, por favor inicie sesion" });
          res.render("register", { errors });
        } else {
          pool.query(
            `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, password`,
            [name, email, passEncrypt],
            (err, res) => {
              if (err) {
                throw err;
              } else {
                console.log(res.rows);
              }
            }
          );
          req.flash(
            "success_msg",
            "Cuenta creada exitosamente. Ahora ya puedes inicar sesion"
          );
          res.redirect("/users/login");
        }
      }
    );
  }
});

//             //

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server initialized on port ${PORT}`);
});
