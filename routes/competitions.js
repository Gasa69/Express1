const express = require("express");
const router = express.Router();
const { authRequired, adminRequired } = require("../services/auth.js");
const Joi = require("joi");
const { db } = require("../services/db.js");

// GET /competitions
router.get("/", authRequired, function (req, res, next) {
    const stmt = db.prepare(`
    SELECT c.id, c.name, c.description, u.name AS author, c.apply_till
    FROM competitions c, users u
    WHERE c.author_id = u.id
    ORDER BY c.apply_till
    `);
    const result = stmt.all();

    res.render("competitions/index", { result: { items: result } });
});

const schema_id = Joi.object({
    id: Joi.number().integer().positive().required()

});

// GET /competitions/delete/:id
router.get("/delete/:id", adminRequired, function (req, res, next) {
    // do validation
    const result = schema_id.validate(req.body);
    if (result.error) {
        throw new Error("Neispravan poziv")
    }

    const stmt = db.prepare("DELETE FROM competitions WHERE id = ?;");
    const deleteResult = stmt.run(req.params.id);

    if  (!deleteResult.changes || deleteResult.changes !== 1) {
        throw new Error("Operacija nije uspjela");
    }

    res.redirect("/competitions");
});

// GET /competitions/edit/:id
router.get("/edit/:id", adminRequired, function (req, res, next) {
    // do validation
    const result = schema_id.validate(req.body);
    if (result.error) {
        throw new Error("Neispravan poziv");
    }

    const stmt = db.prepare("SELECT * FROM competitions WHERE id = ?;");
    const selectResult = stmt.get(req.params.id);

    if (!selectResult){
        throw new Error("Neispravan poziv");
    }

    res.render("competitions/form", {result: { display_form: true, edit: selectResult}});
});

// GET /competitions/add
router.get("/add", adminRequired, function (req, res, next) {
    res.render("competitions/form", { result: { display_form: true } });
});

// SCHEMA signup
const schema_add = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(3).max(1000).required(),
    apply_till: Joi.date().iso().required()
});

// POST /competitions/add
router.post("/add", adminRequired, function (req, res, next) {
    // do validation
    const result = schema_add.validate(req.body);
    if (result.error) {
        res.render("competitions/form", { result: { validation_error: true, display_form: true } });
        return;
    }

    const stmt = db.prepare("INSERT INTO competitions (name, description, author_id, apply_till) VALUES (?, ?, ?, ?);");
    const insertResult = stmt.run(req.body.name, req.body.description, req.user.sub, req.body.apply_till);

    if (insertResult.changes && insertResult.changes === 1) {
        res.render("competitions/form", { result: { success: true } });
    } else {
        res.render("competitions/form", { result: { database_error: true } });
    }
});

module.exports = router;