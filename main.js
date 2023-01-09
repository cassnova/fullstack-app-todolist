const express = require("express");
const app = express();
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");
const inizializePassport = require("./passportConfig");

inizializePassport(passport);

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
app.use(passport.session());
app.use(passport.initialize());

//           //

// ROUTES //
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/users/register", checkAuthenticated, (req, res) => {
  res.render("register");
});

let newItems = [];
app.get("/users/login", checkAuthenticated, (req, res) => {
  res.render("login");
});

app.get("/users/dashboard", checkNotAuthenticated, (req, res) => {
  res.render("dashboard", { user: req.user.name, newListItems: newItems });
});

// POST IN  DASHBOARD TODO LIST  //
app.post("/users/dashboard", (req, res) => {
  let newItem = req.body.newItem;
  newItems.push(newItem);
  res.redirect("/users/dashboard");
});

//                    //

app.get("/users/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      throw err;
    }
    req.flash("Se cerro la sesion con exito");
    res.redirect("/users/login");
  });
});

//             //

//        POST METHOD  TO REGISTER          //
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

//  POST METHOD TO LOGIN   //
app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: "/users/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true,
  })
);

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/users/dashboard");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
}

//                             //

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server initialized on port ${PORT}`);
});
