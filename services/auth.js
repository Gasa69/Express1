const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const jwt = require("jsonwebtoken");
const { db } = require("./db.js");

function getUserJwt(id, email, name, role, expDays = 7) {
    const tokenData = {
        sub: id,
        email: email,
        name: name,
        role: role,
        time: Date.now()
    };

    const tokenOptions = {
        expiresIn: expDays * 24 * 60 * 60
    };

    const token = jwt.sign(tokenData, JWT_SECRET_KEY, tokenOptions);

    return token;
}

// MIDDLEWARE FOR PARSING AUTH COOKIE
function parseAuthCookie(req, res, next) {
    const token = req.cookies[process.env.AUTH_COOKIE_KEY];
    let result = null;
    try {
        result = jwt.verify(token, JWT_SECRET_KEY);
    } catch (error) {
        next();
        return;
    }
    req.user = result;
    res.locals.user = result;
    res.locals.user.is_admin = result.role === "admin" ? true : false;
    next();
}

// MIDDLEWARE FOR AUTHENTICATION CHECK
function authRequired(req, res, next) {
    if (!req.user) throw new Error("Potrebna je prijava u sustav");
    next();
}

// MIDDLEWARE FOR ADMIN CHECK
function adminRequired(req, res, next) {
    if (!req.user || req.user.role !== "admin") throw new Error("Dopušteno samo administratorima");
    next();
}

function checkEmailUnique(email) {
    const stmt = db.prepare("SELECT count(*) FROM users WHERE email = ?;");
    const result = stmt.get(email);

    if (result["count(*)"] >= 1) {
        return false;
    } else {
        return true;
    }
}

module.exports = {
    getUserJwt,
    parseAuthCookie,
    authRequired,
    checkEmailUnique,
    adminRequired
};