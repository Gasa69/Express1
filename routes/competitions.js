const express = require("express");
const router = express.Router();
const { checkAuthCookie } = require("../services/auth.js");
router.get("/", function (req, res, next) {
    res.render("competitions/index");
});

module.exports = router;