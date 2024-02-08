const express = require("express");
const router = express.Router();
const Joi = require("joi");
const { db } = require("../services/db.js");
const { getUserJwt, checkEmailUnique, authRequired } = require("../services/auth.js");
const bcrypt = require("bcrypt");

// GET /users/data
router.get("/data", authRequired, function (req, res, next) {
  res.render("users/data", { result: { display_form: true } });
});

const schema_data = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().max(50).required(),
  password: Joi.string().min(3).max(50).allow(null, "")
});

// POST /users/data
router.post("/data", authRequired, function (req, res, next) {
  // do validation
  const result = schema_data.validate(req.body);
  if (result.error) {
    res.render("users/data", { result: { validation_error: true, display_form: true } });
    return;
  }

  const newName = req.body.name;
  const newEmail = req.body.email;
  const newPassword = req.body.password;
  const currentUser = req.user;

  let dataChanged = [];

  let emailChanged = false;
  if (newEmail !== currentUser.email) {
    if (!checkEmailUnique(newEmail)) {
      res.render("users/data", { result: { email_in_use: true, display_form: true } });
      return;
    }
    emailChanged = true;
    dataChanged.push(newEmail);
  }

  let nameChanged = false;
  if (newName !== currentUser.name) {
    nameChanged = true;
    dataChanged.push(newName);
  }

  let passwordChanged = false;
  let passwordHash;
  if (newPassword && newPassword.length > 0) {
    passwordHash = bcrypt.hashSync(newPassword, 10);
    passwordChanged = true;
    dataChanged.push(passwordHash);
  }

  if (!emailChanged && !nameChanged && !passwordChanged) {
    res.render("users/data", { result: { display_form: true } });
    return;
  }

  let query = "UPDATE users SET";
  if (emailChanged) query += " email = ?,";
  if (nameChanged) query += " name = ?,";
  if (passwordChanged) query += " password = ?,";
  query = query.slice(0, -1);
  query += " WHERE email = ?;";
  dataChanged.push(currentUser.email);

  const stmt = db.prepare(query);
  const updateResult = stmt.run(dataChanged);

  if (updateResult.changes && updateResult.changes === 1) {
    res.render("users/data", { result: { success: true } });
  } else {
    res.render("users/data", { result: { database_error: true } });
  }
});

// GET /users/signout
router.get("/signout", authRequired, function (req, res, next) {
  res.clearCookie(process.env.AUTH_COOKIE_KEY);
  res.redirect("/");
});

// GET /users/signin
router.get("/signin", function (req, res, next) {
  res.render("users/signin", { result: { display_form: true } });
});

// SCHEMA signin
const schema_signin = Joi.object({
  email: Joi.string().email().max(50).required(),
  password: Joi.string().min(3).max(50).required()
});

// POST /users/signin
router.post("/signin", function (req, res, next) {
  // do validation
  const result = schema_signin.validate(req.body);
  if (result.error) {
    res.render("users/signin", { result: { validation_error: true, display_form: true } });
    return;
  }

  const email = req.body.email;
  const password = req.body.password;

  const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
  const dbResult = stmt.get(email);

  if (dbResult) {
    const passwordHash = dbResult.password;
    const compareResult = bcrypt.compareSync(password, passwordHash);

    if (!compareResult) {
      res.render("users/signin", { result: { invalid_credentials: true } });
      return;
    }

    const token = getUserJwt(dbResult.id, dbResult.email, dbResult.name, dbResult.role);
    res.cookie(process.env.AUTH_COOKIE_KEY, token);

    res.render("users/signin", { result: { success: true } });
  } else {
    res.render("users/signin", { result: { invalid_credentials: true } });
  }
});

// SCHEMA signup
const schema_signup = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().max(50).required(),
  password: Joi.string().min(3).max(50).required(),
  password_check: Joi.ref("password")
});

// GET /users/signup
router.get("/signup", function (req, res, next) {
  res.render("users/signup", { result: { display_form: true } });
});

// POST /users/signup
router.post("/signup", function (req, res, next) {
  // do validation
  const result = schema_signup.validate(req.body);
  if (result.error) {
    res.render("users/signup", { result: { validation_error: true, display_form: true } });
    return;
  }

  if (!checkEmailUnique(req.body.email)) {
    res.render("users/signup", { result: { email_in_use: true, display_form: true } });
    return;
  }

  const passwordHash = bcrypt.hashSync(req.body.password, 10);
  const stmt2 = db.prepare("INSERT INTO users (email, password, name, signed_at, role) VALUES (?, ?, ?, ?, ?);");
  const insertResult = stmt2.run(req.body.email, passwordHash, req.body.name, new Date().toISOString(), "user");

  if (insertResult.changes && insertResult.changes === 1) {
    res.render("users/signup", { result: { success: true } });
  } else {
    res.render("users/signup", { result: { database_error: true } });
  }
  return;
});

module.exports = router;
