const express = require("express");
const app = express();
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");
const inizializePassport = require("./passportConfig");
const { Router } = require("express");

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

app.get("/users/dashboard/edit", (req, res) => {
  // let todo_id = req.body.id;
  res.render("edit");
});

app.get("/users/register", checkAuthenticated, (req, res) => {
  res.render("register");
});

let newItems = [];

app.get("/users/login", checkAuthenticated, (req, res) => {
  res.render("login");
});

app.get("/users/dashboard", checkNotAuthenticated, (req, res) => {
  let idUser = req.user.id;
  pool
    .query(`SELECT description FROM todo WHERE user_id = $1`, [idUser])
    .then((result) => {
      // Procesar el resultado de la consulta y mostrar las "description" en pantalla
      res.render("dashboard", {
        user: req.user.name,
        newListItems: result.rows,
      });
    })
    .catch((error) => {
      // Manejar cualquier error que ocurra durante la ejecución de la consulta
      console.error(error);
      res.send("Error al obtener las description");
    });
});

// SECOND POST IN DASHBOARD TODO LIST //
app.post("/users/dashboard", async (req, res) => {
  try {
    let description = req.body.newItem;
    let idUser = req.user.id;
    const newTodo = await pool.query(
      `INSERT INTO todo (description, user_id) VALUES ($1, $2) RETURNING *`,
      [description, idUser]
    );
    newItems.push(description);
    res.redirect("/users/dashboard");
    // res.render("dashboard", newTodo.rows, { user: req.user.name });
    // res.redirect("/users/dashboard");
  } catch (err) {
    console.error(err.message);
  }
});

// GET ALL DATA   //
app.get("/users/dashboard", async (req, res) => {
  try {
    let idUser = req.user.id;
    const allTodos = await pool.query(
      `SELECT description FROM todo WHERE user_id = $1`,
      [idUser]
    );
  } catch (err) {
    console.error(err.message);
  }
});

//

// UPDATE A TODO     //
app.get("/users/dashboard/edit", async (req, res) => {
  try {
    const id = req.params.id;
    const todo = await pool.query(`SELECT * FROM todo WHERE todo_id = $1`, [
      id,
    ]);
    res.render("edit", { todo: todo.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/users/dashboard/edit", async (req, res) => {
  let id = req.body.id;
  let newMessage = req.body.mensaje;
  console.log(id);
  try {
    const result = await pool.query(
      "UPDATE todo SET description = $1 WHERE todo_id = $2 RETURNING *",
      [newMessage, id]
    );
    res.status(200);
    res.redirect("/users/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Error al actualizar el mensaje",
    });
  }
});

// app.post("/users/dashboard/edit/:id", async (req, res) => {
//   try {
//     const { todo_id, description } = req.body;
//     await pool.query(`UPDATE todo SET description = $1 WHERE todo_id = $2`, [
//       description,
//       todo_id,
//     ]);
//     res.redirect("/users/dashboard");
//   } catch (err) {
//     console.error(err.message);
//   }
// });

// app.get("/users/dashboard/edit/:id", async (req, res) => {
//   try {
//     const id = req.params;
//     const todo = await pool.query(`SELECT * FROM todo WHERE todo_id = $1`, [
//       id,
//     ]);
//     res.render("edit", { todo: todo.rows[0] });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

//

// DELETE A TODO     /
app.post("/users/dashboard/delete", async (req, res) => {
  try {
    const { description } = req.body;
    await pool.query(`DELETE FROM todo WHERE description = $1`, [description]);
    res.redirect("/users/dashboard");
  } catch (err) {
    console.error(err);
  }
});

//

// LOGOUT  //

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

//

//     GET AND POST METHOD TO CHANGE PASS                  //
app.get("/change-password", (req, res) => {
  res.render("change-password");
});

app.post("/change-password", async (req, res) => {
  let email = req.body;
  let password = req.body;
  const passEncrypt = await bcrypt.hash(password, 10);

  pool.query(
    "UPDATE users SET password = $1 WHERE email = $2",
    [passEncrypt, email],
    (err, result) => {
      if (err) {
        console.error(err);
      }
      req.flash("success_msg", "Contraseña Actualizada, ahora inicia sesion");
      res.redirect("/users/login");
    }
  );
});

// app.post("/users/change-password", (req, res) => {
//   // retrieve the current password, new password, and confirm new password from the request body
//   const currentPassword = req.body["current-password"];
//   const newPassword = req.body["new-password"];
//   const confirmNewPassword = req.body["confirm-new-password"];

//   // get the current logged in user's email address from the session
//   const email = req.session.email;

//   // check if the new password and the confirmed new password match
//   if (newPassword !== confirmNewPassword) {
//     req.flash("error", "Las contraseñas no coinciden");
//     res.redirect("/change-password");
//     return;
//   }

//   // check if the current password is correct
//   // you can use the passport.authenticate() method to check this
// passport.authenticate("local", {
//   successRedirect: "/",
//   failureRedirect: "/change-password",
//   failureFlash: true,
// });

//   // Update the password
//   pool.query(
//     "UPDATE users SET password = $1 WHERE email = $2",
//     [bcrypt.hashSync(newPassword, 10), email],
//     (error) => {
//       if (error) {
//         throw error;
//       }
//       req.flash("success_msg", "La contraseña ha sido actualizada");
//       res.redirect("/");
//     }
//   );
// });

//

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server initialized on port ${PORT}`);
});
