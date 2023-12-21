const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const jwt = require("jsonwebtoken");

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
// MIDDLEWARE FOR AUTH COOKIE CHECK
function checkAuthCookie(req, res, next) {
    const token = req.cookies["auth"];
    console.log("COOKIE CHECK", token);

    let result = null;
    try {
        const result = jwt.verify(token, JWT_SECRET_KEY);
    } catch (eror) {
        console.log("ERROR", error);
        next();
    }

    req.user = result;
    next();


}
module.exports = {
    getUserJwt,
    checkAuthCookie

};

