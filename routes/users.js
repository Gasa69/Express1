const express = require("express");
const router = express.Router();
const Joi = require("joi");
const { db } = require("../services/db.js");
const { getUserJwt } = require("../services/auth.js");
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

  const stmt = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?");
  const dbResult = stmt.get(email, password);
  console.log("DB Result", dbResult);
  if (dbResult) {

    const token = getUserJwt(dbResult.id, dbResult.email, dbResult.name, dbResult.role);
    console.log("NEWTOKEN", token);
    res.cookie("auth", token);
    //spremamo JWT u cookie 


    res.render("users/signin", { result: { success: true } });
  }
});

module.exports = router;
