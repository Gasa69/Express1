const JWT_SECRET_KEY="yWGwwVHDqLSwbUgaqYyfJxW4F0dAgM1TWfC26XrDtAKxmaXek38HWWqAGubTbDL3xyTRRHoCZGl91AMGh809peCXAictR8LvH5CCSWdg3F4dyXlQza5slso9VUwca1v1NP"

const jwt = require("jsonwebtoken");

function getUserJwt(id, email, name, role, expDays = 7) {
    const tokenData = {
        uid: id,
        email: email,
        name: name,
        role: role,
        time: Date.now()
    };
    const tokenOptions ={
        expiresIn: expDays * 24 *60 * 60
    };

    const token = jwt.sign(tokenData, JWT_SECRET_KEY, tokenOptions);


return token;
}
// MIDDLEWARE FOR AUTH COOKIE CHECK
function checkAuthCookie(req, res, nex) {
    const token = req.cookies["auth"]; 
    console.log("COOKIE CHECK", token);

    const result = jwt.verify(token, JWT_SECRET_KEY);
    console.log("TOKEN CHECK", result);


}
    module.exports = {
        getUserJwt,
        checkAuthCookie

    };

