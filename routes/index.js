const express = require("express");
const router = express.Router();
const { checkAuthCookie } = require("../services/auth.js");

// GET /
router.get("/", function (req, res, next) {
  res.render("index");
});

module.exports = router;
