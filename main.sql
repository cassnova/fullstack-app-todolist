CREATE DATABASE fullstackapp;

CREATE TABLE users(
  id BIGSERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(55) NOT NULL,
  email VARCHAR(55) NOT NULL UNIQUE,
  password VARCHAR(55) NOT NULL
);


CREATE TABLE todo(
  todo_id SERIAL PRIMARY KEY,
  description VARCHAR(255)
);

ALTER TABLE todo ADD COLUMN user_id INTEGER REFERENCES users(id);