const localStrategy = require("passport-local").Strategy;
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");

function inizialize(passport) {
  const authUser = (email, passport, realize) => {
    pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email],
      (err, result) => {
        if (err) {
          throw err;
        }
        console.log(result.rows);

        if (result.rows.length > 0) {
          const user = result.rows[0];

          bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
              throw err;
            }
            if (isMatch) {
              return realize(null, user);
            } else {
              return realize(null, false, {
                msg: "Contraseña invalida",
              });
            }
          });
        } else {
          return realize(null, false, {
            msg: "Correo electronico no registrado",
          });
        }
      }
    );
  };

  passport.use(
    new localStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      authUser
    )
  );

  passport.serializeUser((user, realize) => {
    realize(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    pool.query(`SELECT * FROM users WHERE id = $1`, [id], (err, result) => {
      if (err) {
        throw err;
      }
      return done(null, result.rows[0]);
    });
  });
}

module.exports = inizialize;
