const Database = require("better-sqlite3");

const db = new Database("baza.sqlite3", { verbose: console.log });

module.exports = { db };