require("dotenv").config();

const { Pool } = require("pg");

// const config = {
//   user: "postgress",
//   host: "localhost",
//   password: "OrionArya7319456zxcasdqwe",
//   database: "fullstackapp",
// };

// const pool = new Pool(config);

const isProduction = process.env.NODE_ENV === "production";

const connection = `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

const pool = new Pool({
  connection: isProduction ? process.env.DATABASE_URL : connection,
});

module.exports = { pool };
