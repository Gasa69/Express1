const express = require("express");
const router = express.Router();
const Joi = require("joi");
const { db } = require("../services/db.js");
const { getUserJwt } = require("../services/auth.js");
const bcrypt = require("bcrypt");

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
  const result = schema_signup.validate(req.body);
  if (result.error) {
    res.render("users/signin", { result: { validation_error: true, display_form: true } });
    return;
  }

  const email = req.body.email;
  const password = req.body.password;

  const stmt = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?");
  const dbResult = stmt.get(email, password);
  console.log("DB Result", dbResult);
  if (dbResult) {

    const token = getUserJwt(dbResult.id, dbResult.email, dbResult.name, dbResult.role);
    console.log("NEWTOKEN", token);
    res.cookie("auth", token);

    res.render("users/signin", { result: { success: true } });
  } else {
    res.render("users/signin", { result: { invalid_credentials: true } });

  }
});

// SCHEMA signin
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

const passwordHash = bcrypt.hashSync (rew.body.password, 10);

console.log ("DATA", req.body);

});


module.exports = router;
