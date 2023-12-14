const Database = require("better-sqlite3");

const db = new Database("db.sqlite3", { verbose: console.log });

module.exports = { db };