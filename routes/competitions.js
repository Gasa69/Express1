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

// SCHEMA id
const schema_id = Joi.object({
    id: Joi.number().integer().positive().required()
});

// GET /competitions/delete/:id
router.get("/delete/:id", adminRequired, function (req, res, next) {
    // do validation
    const result = schema_id.validate(req.params);
    if (result.error) {
        throw new Error("Neispravan poziv");
    }


    const checkStmt1 = db.prepare("SELECT count(*) FROM login WHERE id_competition = ?");
    const checkResult1 = checkStmt1.get(req.params.id);

    if (checkResult1["count(*)"] >= 1) {
        const stmt1 = db.prepare("DELETE FROM login WHERE id_competition = ?;");
        const deleteResult1 = stmt1.run(req.params.id);

        const stmt2 = db.prepare("DELETE FROM competitions WHERE id = ?;");
        const deleteResult2 = stmt2.run(req.params.id);
    }

    else {
        const stmt = db.prepare("DELETE FROM competitions WHERE id = ?;");
        const deleteResult = stmt.run(req.params.id);

        if (!deleteResult.changes || deleteResult.changes !== 1) {
            throw new Error("Operacija nije uspjela");
        }
    }

    res.redirect("/competitions");
});

// GET /competitions/edit/:id
router.get("/edit/:id", adminRequired, function (req, res, next) {
    // do validation
    const result = schema_id.validate(req.params);
    if (result.error) {
        throw new Error("Neispravan poziv");
    }

    const stmt = db.prepare("SELECT * FROM competitions WHERE id = ?;");
    const selectResult = stmt.get(req.params.id);

    if (!selectResult) {
        throw new Error("Neispravan poziv");
    }

    res.render("competitions/form", { result: { display_form: true, edit: selectResult } });
});

// SCHEMA edit
const schema_edit = Joi.object({
    id: Joi.number().integer().positive().required(),
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(3).max(1000).required(),
    apply_till: Joi.date().iso().required()
});

// POST /competitions/edit
router.post("/edit", adminRequired, function (req, res, next) {
    // do validation
    const result = schema_edit.validate(req.body);
    if (result.error) {
        res.render("competitions/form", { result: { validation_error: true, display_form: true } });
        return;
    }

    const stmt = db.prepare("UPDATE competitions SET name = ?, description = ?, apply_till = ? WHERE id = ?;");
    const updateResult = stmt.run(req.body.name, req.body.description, req.body.apply_till, req.body.id);

    if (updateResult.changes && updateResult.changes === 1) {
        res.redirect("/competitions");
    } else {
        res.render("competitions/form", { result: { database_error: true } });
    }
});

// GET /competitions/add
router.get("/add", adminRequired, function (req, res, next) {
    res.render("competitions/form", { result: { display_form: true } });
});

// SCHEMA add
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


// GET /competitions/login/:id
router.get("/login/:id", function (req, res, next) {

    // do validation
    const result = schema_id.validate(req.params);
    if (result.error) {
        throw new Error("Neispravan poziv");
    }

    // PROVJERA JE LI KORISNIK UPISAN

    const checkStmt1 = db.prepare("SELECT count(*) FROM login WHERE id_user = ? AND id_competition = ?;");
    const checkResult1 = checkStmt1.get(req.user.sub, req.params.id);

    if (checkResult1["count(*)"] >= 1) {
        res.render("competitions/form", { result: { database_error: true } });
    }
    else {

        // UPIS

        const stmt = db.prepare("INSERT INTO login (id_user, id_competition) VALUES (?, ?);");
        const updateResult = stmt.run(req.user.sub, req.params.id);

        if (updateResult.changes && updateResult.changes === 1) {
            res.render("competitions/form", { result: { success: true } });
        } else {
            res.render("competitions/form", { result: { database_error: true } });
        }
    }
});


// GET /competitions/score_input/:id

router.get("/score_input/:id", adminRequired, function (req, res, next) {

    const stmt = db.prepare(`
        SELECT c.name AS CompName, u.name AS Competitor, l.id AS login_id, l.id_user, l.score
        FROM competitions c, users u, login l
        WHERE l.id_user = u.id AND l.id_competition = c.id AND l.id_competition = ?;
    `);

    const result = stmt.all(req.params.id);

    res.render("competitions/score_input", { result: { items: result } });
});

// SCHEMA score
const schema_score = Joi.object({
    id: Joi.number().integer().positive().required(),
    score: Joi.number().min(1).max(50).required()
});

// POST /competitions/score_change/
router.post("/score_change", authRequired, function (req, res, next) {
    // do validation
    const result = schema_score.validate(req.body);
    if (result.error) {
        throw new Error("Neispravan poziv");
        return;
    }

    const stmt = db.prepare("UPDATE login SET score = ? WHERE id = ?;");
    const updateResult = stmt.run(req.body.score, req.body.id);

    if (updateResult.changes && updateResult.changes === 1) {
        res.render("competitions/form", { result: { score_success: true } });
    } else {
        res.render("competitions/form", { result: { database_error: true } });
    }
});


// GET /competitions/leaderbaord/:id

router.get("/leaderboard/:id", function (req, res, next) {

    const stmt = db.prepare(`
        SELECT u.name AS natjecatelj, l.score, l.id_user
        FROM competitions c, users u, login l
        WHERE l.id_user = u.id AND l.id_competition = c.id AND l.id_competition = ?
        ORDER BY l.score DESC;
    `);

    const result = stmt.all(req.params.id);

    console.log(result);

    const stmt1 = db.prepare(`
        SELECT name AS natjecanje, apply_till AS datum
        FROM competitions
        WHERE id = ?
    `);

    const data = stmt1.all(req.params.id);

    res.render("competitions/leaderboard", { layout: 'noheader', result: { items: result, data }, data: { items: data } });
});


router.get("/questions/:id", authRequired, function (req, res, next) {
    res.render("competitions/questions", { result: { display_form: true } });
});

// SCHEMA data
const schema_questions = Joi.object({
    q1: Joi.string().min(1).max(250).required(),
    q2: Joi.string().min(1).max(250).required(),
    q3: Joi.string().min(1).max(250).required(),
    q4: Joi.string().min(1).max(250).required(),
    q5: Joi.string().min(1).max(250).required(),
});

// POST /competitions/questions
router.post("/questions", adminRequired, function (req, res, next) {
    // do validation
    const result = schema_questions.validate(req.body);
    if (result.error) {
        res.render("competitions/questions", { result: { validation_error: true, display_form: true } });
        return;
    }

    const stmt = db.prepare("INSERT INTO questions (q1, q2, q3, q4, q5) VALUES (?, ?, ?, ?, ?);");
    const insertResult = stmt.run(req.body.q1, req.body.q2, req.body.q3, req.body.q4, req.body.q5);

    if (insertResult.changes && insertResult.changes === 1) {
        res.render("competitions/questions", { result: { success: true } });
    } else {
        res.render("competitions/questions", { result: { database_error: true } });
    }
});

// GET /competitions/list_q
router.get("/list_q/:id", authRequired, function (req, res, next) {
    const stmt = db.prepare(`
    SELECT q.q1, q.q2, q.q3, q.q4, q.q5, q.id, c.id, l.id_user, u.id
    FROM competitions c, questions q, login l, users u
    WHERE c.id = q.id AND l.id_user = u.id
    `);

    const result = stmt.all();

    console.log(result);

    res.render("competitions/list_q", { result: { items: result } });
});

// SCHEMA data
const schema_responses = Joi.object({
    r1: Joi.string().min(1).max(250).required(),
    r2: Joi.string().min(1).max(250).required(),
    r3: Joi.string().min(1).max(250).required(),
    r4: Joi.string().min(1).max(250).required(),
    r5: Joi.string().min(1).max(250).required(),
    id: Joi.number().integer().positive().required()
});

// POST /competitions/list_q
router.post("/list_q", function (req, res, next) {
    // do validation
    const result = schema_responses.validate(req.body);

    if (result.error) {
        res.render("competitions/list_q", { result: { validation_error: true, display_form: true } });
        return;
    }

    const stmt = db.prepare("INSERT INTO responses (r1, r2, r3, r4, r5, q_id) VALUES (?, ?, ?, ?, ?, ?);");
    const insertResult = stmt.run(req.body.r1, req.body.r2, req.body.r3, req.body.r4, req.body.r5, req.body.id);

    if (insertResult.changes && insertResult.changes === 1) {
        res.render("competitions/list_q", { result: { success: true } });
    } else {
        res.render("competitions/list_q", { result: { database_error: true } });
    }
});
module.exports = router;