const mysql = require("mysql2/promise");
const { getEnv } = require("./env");

const db = mysql.createPool({ ...getEnv().db });

module.exports = db;
