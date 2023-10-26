const express = require("express");
const app = express();
const port = 8080;

app.get("/", (request, response) => {
    response.send("I am alive!");
});

app.get("/proba/:name", (request, response) => {
    console.log("Name:", request.params.name);
    response.send("Good day, " + request.params.name);
});

app.listen(port, () => {
    console.log("I am listening...");
});