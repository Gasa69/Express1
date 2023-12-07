var express = require('express');
var router = express.Router();
const Joi = require("joi");

const { db  } = require("../services/db.js");

router.get('/signin', function (req, res, next) {
  res.render('users/signin');
});
const signinSchema = Joi.object({
  email: Joi.string().email().max(50).required(),
  password: Joi.string().min(3).max(50).required()
});

router.post('/signin', function (req, res, next) {
  const result = signinSchema.validate(req.body);
  if (result.error) {
    res.sendStatus(400);
  }

  const email = req.body.email;
  const password = req.body.password;

const stmt = db.prepare("SELECT * FROM users WHERE email= ? AND password = ?");
const dbResult = stmt.get(email, password);
console.log("DB kaže", dbResult);

  res.render('users/signin');
});

  module.exports = router;
