const Database = require("better-sqlite3");

const db = new Database(process.env.DB_PATH, { verbose: console.log });

module.exports = { db };